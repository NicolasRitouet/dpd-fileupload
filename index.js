"use strict";

/**
 * Module dependencies
 */
var Resource   = require('deployd/lib/resource'),
    util       = require('util'),
    formidable = require('formidable'),
    fs         = require('fs');

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
            files = [],
            subdir,
            resultFiles = [];
        var uploadDir = this.config.fullDirectory;

        // If subdir was sent as query param, concat it to the default uploadDir
        if (typeof req.query !== 'undefined' && req.query.subdir) {
            subdir = req.query.subdir;
            uploadDir = uploadDir.concat(req.query.subdir).concat("/");
            // create the directory if it does not exist
            try {
                fs.statSync(uploadDir).isDirectory();
            } catch (er) {
                fs.mkdir(uploadDir);
            }
        }
        form.uploadDir = uploadDir;

        form.parse(req)
            .on('file', function(name, file) {
                files.push(name);

                if (self.events.upload) {
                    self.events.upload.run(ctx, {url: ctx.url, fileSize: file.size, fileName: ctx.url}, function(err) {
                        if (err) return ctx.done(err);
                        fs.rename(file.path, uploadDir + file.name, function(err) {
                            if (err) return ctx.done(err);
                            self.store.insert({filename: name, subdir: subdir}, function(err, result) {
                                resultFiles.push(result);
                            });

                        });
                    });
                } else {
                    fs.rename(file.path, uploadDir + file.name, function(err) {
                        if (err) return ctx.done(err);
                        self.store.insert({filename: name, subdir: subdir}, function(err, result) {
                            resultFiles.push(result);
                        });
                    });
                }
            })
            .on('error', function(err) {
                return ctx.done(err);
            }).on('end', function() {
                return ctx.done(null, resultFiles);
            });
        return;
    } else if (req.method === "GET") {
        if (ctx.res.internal) return next(); // This definitely has to be HTTP.

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
        req = ctx.req,
        reqParam = {};

    if (ctx.query.subdir) {
        reqParam.subdir = ctx.query.subdir;
    }

    console.log(ctx);
    if (!ctx.query.id) {
        self.store.find(reqParam, function(err, result) {
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
        console.log("Result:", result);
        if (typeof result !== 'undefined') {
            self.store.remove({id: fileId}, function(err) {
                if (err) return ctx.done(err);
                fs.unlink(uploadDir + result.subdir + "/" + result.filename, function(err) {
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