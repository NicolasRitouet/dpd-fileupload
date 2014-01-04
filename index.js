"use strict";

/**
 * Module dependencies
 */
var Resource   = require('deployd/lib/resource'),
    httpUtil   = require('deployd/lib/util/http'),
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
        fs.statSync(this.config.fullDirectory).isDirectory()
    } catch (er) {
        console.log("Creating the folder " + this.config.fullDirectory);
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
        console.log("Subdir : ", req.query.subdir);
        var form = new formidable.IncomingForm(),
            files = [];
        var uploadDir = this.config.fullDirectory;

        // If subdir was sent as query param, concat it to the default uploadDir
        if (req.query.subdir) {
            uploadDir = uploadDir.concat(req.query.subdir).concat("/");
            try {
                fs.statSync(uploadDir).isDirectory()
            } catch (er) {
                console.log("Creating the folder " + uploadDir);
                fs.mkdir(uploadDir);
            }
        }
        form.uploadDir = uploadDir;

        form.parse(req)
            .on('file', function(name, file) {
                console.log("New file: ", name);
                files.push(name);

                if (self.events.upload) {
                    self.events.upload.run(ctx, {url: ctx.url, fileSize: file.size, fileName: ctx.url}, function(err) {
                        if (err) return ctx.done(err);
                        fs.rename(file.path, uploadDir + file.name, function(err) {
                            if (err) return ctx.done(err);
                            self.store.insert({filename: name, subdir: req.query.subdir}, function() {
                            });

                        });
                    });
                } else {
                    fs.rename(file.path, uploadDir + file.name, function(err) {
                        if (err) return ctx.done(err);
                        self.store.insert({filename: name, subdir: req.query.subdir}, function() {
                        });
                    });
                }
            })
            .on('error', function(err) {
                return ctx.done(err);
            }).on('end', function() {
                console.log("Request finished! ", files);
                if (req.headers.referer) {
                    httpUtil.redirect(ctx.res, req.headers.referer || '/');
                } else {
                    return ctx.done(null, { statusCode: 200, message: 'Files (' + files.join(", ") + ') successfully uploaded' });
                }
            });
        req.resume();
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
        req = ctx.req;
    if (!ctx.query.id) {
        self.store.find(function(err, result) {
            ctx.done(err, result);
        });
    }
};

// Delete a file
Fileupload.prototype.del = function(ctx, next) {
    var self = this,
        filename = ctx.url.split('/')[1],
        uploadDir = this.config.fullDirectory,
        subdir = ctx.req.query.subdir;
    if (subdir) {
        uploadDir = uploadDir.concat(subdir).concat("/");
    }
    fs.unlink(uploadDir + filename, function(err) {
        if (err) return ctx.done(err);
        self.store.find({query: {filename: filename, subdir: subdir}}, function(err, result) {
            if (typeof result === 'undefined' || result.length < 0) {
                return ctx.done(null, {statusCode: 200, message: 'File ' + filename + ' successfully deleted'});
            }
            self.store.remove({id: result[0].id}, function(err) {
                ctx.done(err, {statusCode: 200, message: 'File ' + filename + ' successfully deleted'});
            });
        });
    });
};

/**
 * Module export
 */
module.exports = Fileupload;
