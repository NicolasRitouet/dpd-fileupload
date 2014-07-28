"use strict";

/**
 * Module dependencies
 */
var Resource   = require('deployd/lib/resource'),
    util       = require('util'),
    debug      = require('debug')('dpd-fileupload'),
    formidable = require('formidable'),
    fs         = require('fs'),
    md5        = require('MD5'),
    mime       = require('mime');

/**
 * Module setup.
 */
function Fileupload(options) {

    Resource.apply(this, arguments);

    this.store = process.server.createStore(this.name + "fileupload");

    this.config = {
        directory: this.config.directory || 'upload',
        fullDirectory: __dirname + "/../../public/" + (this.config.directory || 'upload') + "/"
    };

    if (this.name === this.config.directory) {
        this.config.directory = this.config.directory + "_";
    }

    // If the directory doesn't exists, we'll create it
    try {
        fs.statSync(this.config.fullDirectory).isDirectory();
    } catch (er) {
        fs.mkdir(this.config.fullDirectory);
    }
}

util.inherits(Fileupload, Resource);

Fileupload.label = "File upload";
Fileupload.events = ["get", "upload", "delete"];
Fileupload.prototype.clientGeneration = true;
Fileupload.basicDashboard = {
    settings: [
        {
            name: 'directory',
            type: 'text',
            description: 'Directory to save the uploaded files. Defaults to \'upload\'.'
        }
    ]
};

/**
 * Module methods
 */
Fileupload.prototype.handle = function (ctx, next) {
    var req = ctx.req,
        self = this,
        domain = {url: ctx.url};

    if (req.method === "POST" || req.method === "PUT") {
        var form = new formidable.IncomingForm(),
            uploadDir = this.config.fullDirectory,
            resultFiles = [],
            remainingFile = 0,
            storedObject = {},
            uniqueFilename = false,
            subdir,
            creator;


        // Will send the response if all files have been processed
        var processDone = function(err) {
            if (err) return ctx.done(err);
            remainingFile--;
            if (remainingFile === 0) {
                debug("Response sent: ", resultFiles);
                return ctx.done(null, resultFiles);
            }
        }

        // If we received params from the request
        if (typeof req.query !== 'undefined') {
            for (var propertyName in req.query) {
                debug("Query param found: { %j:%j } ", propertyName, req.query[propertyName]);

                if (propertyName === 'subdir') {
                    debug("Subdir found: %j", req.query[propertyName]);
                    uploadDir = uploadDir.concat(req.query[propertyName]).concat("/");
                    // If the sub-directory doesn't exists, we'll create it
                    try {
                        fs.statSync(uploadDir).isDirectory();
                    } catch (er) {
                        fs.mkdir(uploadDir);
                    }

                } else if (propertyName === 'uniqueFilename') {
                    debug("uniqueFilename found: %j", req.query[propertyName]);
                    uniqueFilename = (req.query[propertyName] === 'true');
                    continue; // skip to the next param since we don't need to store this value
                }

                // Store any param in the object
                try {
                    storedObject[propertyName] = JSON.parse(req.query[propertyName]);
                } catch (e) {
                    storedObject[propertyName] = req.query[propertyName];
                }
            }
        }

        form.uploadDir = uploadDir;

        var renameAndStore = function(file) {
            fs.rename(file.path, uploadDir + file.name, function(err) {
                if (err) return processDone(err);
                debug("File renamed after event.upload.run: %j", err || uploadDir + file.name);
                storedObject.filename = file.name;
                if (uniqueFilename) {
                    storedObject.originalFilename = file.originalFilename;
                }
                storedObject.filesize = file.size;
                storedObject.creationDate = new Date().getTime();

                // Store MIME type in object
                storedObject.mimeType = mime.lookup(file.name);

                self.store.insert(storedObject, function(err, result) {
                    if (err) return processDone(err);
                    debug('stored after event.upload.run %j', err || result || 'none');
                    resultFiles.push(result);
                    processDone();
                });

            });
        }

        form.parse(req)
            .on('file', function(name, file) {
                debug("File %j received", file.name);
                if (uniqueFilename) {
                    file.originalFilename = file.name;
                    file.name = md5(Date.now()) + '.' + file.name.split('.').pop();
                }
                if (self.events.upload) {
                    self.events.upload.run(ctx, {url: ctx.url, filesize: file.size, filename: ctx.url}, function(err) {
                        if (err) return processDone(err);
                        renameAndStore(file);
                    });
                } else {
                    renameAndStore(file);
                }
            }).on('fileBegin', function(name, file) {
                remainingFile++;
                debug("Receiving a file: %j", file.name);
            }).on('error', function(err) {
                debug("Error: %j", err);
                return processDone(err);
            });
        return req.resume();
    } else if (req.method === "GET") {

        if (this.events.get) {
            this.events.get.run(ctx, domain, function(err) {
                if (err) return ctx.done(err);
                self.get(ctx, next);
            });
        } else {
            this.get(ctx, next);
        }

    } else if (req.method === "DELETE") {

        if (this.events['delete']) {
            this.events['delete'].run(ctx, domain, function(err) {
                if (err) return ctx.done(err);
                self.del(ctx, next);
            });
        } else {
            this.del(ctx, next);
        }
    } else {
        next();
    }
};


Fileupload.prototype.get = function(ctx, next) {
    var self = this,
        req = ctx.req;

    if (!ctx.query.id) {
        self.store.find(ctx.query, function(err, result) {
            ctx.done(err, result);
        });
    }
};

// Delete a file
Fileupload.prototype.del = function(ctx, next) {
    var self = this,
        fileId = ctx.url.split('/')[1],
        uploadDir = this.config.fullDirectory;
        
    this.store.find({id: fileId}, function(err, result) {
        if (err) return ctx.done(err);
        debug('found %j', err || result || 'none');
        if (typeof result !== 'undefined') {
            var subdir = "";
            if (result.subdir !== null) {
                subdir = result.subdir;
            }
            self.store.remove({id: fileId}, function(err) {
                if (err) return ctx.done(err);
                fs.unlink(uploadDir + subdir + "/" + result.filename, function(err) {
                    if (err) return ctx.done(err);
                    ctx.done(null, {statusCode: 200, message: "File " + result.filename + " successfuly deleted"});
                });
            });
        }
    });
};

/**
 * Module export
 */
module.exports = Fileupload;