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
        fullDirectory: __dirname + "/../../public/" + (this.config.directory || '/upload') + "/"
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
        var form = new formidable.IncomingForm();
        form.uploadDir = this.config.fullDirectory;
        var remaining = 0;
        var files = [];
        var error;

        var uploadedFile = function(err) {
            if (err) {
                error = err;
                return ctx.done(err);
            } else if (!err) {
                remaining--;
                if (remaining <= 0) {
                    if (req.headers.referer) {
                        httpUtil.redirect(ctx.res, req.headers.referer || '/');
                    } else {
                        ctx.done(null, { statusCode: 200, message: 'Files (' + files.join(", ") + ') successfully uploaded' });
                    }
                }
            }
        };

        form.parse(req)
            .on('file', function(name, file) {
                remaining++;

                if (self.events.upload) {
                    self.events.upload.run(ctx, {url: ctx.url, fileSize: file.size, fileName: ctx.url}, function(err) {
                        if (err) uploadedFile(err);
                        fs.rename(file.path, self.config.fullDirectory + file.name, function(err) {
                            if (err) return uploadedFile(err);
                            self.store.insert({filename: name}, function() {
                                files.push(name);
                                return uploadedFile();
                            });

                        });
                    });
                } else {
                    fs.rename(file.path, self.config.fullDirectory + file.name, function(err) {
                        if (err) return uploadedFile(err);
                        self.store.insert({filename: name}, function() {
                            files.push(name);
                            return uploadedFile();
                        });
                    });
                }
            })
            .on('error', function(err) {
                ctx.done(err);
                error = err;
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
    var self = this;
    var req = ctx.req;
    console.log("Query : ", ctx.query);
    if (!ctx.query.id) {
        self.store.find(function(err, result) {
            console.log(result);
            ctx.done(err, result);
        });
    }
};

// Delete a file
Fileupload.prototype.del = function(ctx, next) {
    var self = this;
    console.log(ctx.url);
    var filename = ctx.url.split('/')[1];
    fs.unlink(this.config.fullDirectory + filename, function(err) {
        if (err) ctx.done(err);
        self.store.find({query:{filename: filename}}, function(err, result) {
            console.log("Found item id: ", result[0].id);


            // TODO : Does not work yet
            self.store.remove({query: {id: result[0].id}}, function(err, result) {
                if (err) console.log(err);
                console.log("Removed item: ", result);
                ctx.done(null, {message: 'File ' + filename + ' successfully deleted'});
            });

        });
    });
};

/**
 * Module export
 */
module.exports = Fileupload;
