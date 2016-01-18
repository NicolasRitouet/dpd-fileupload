'use strict';

/**
 * Module dependencies
 */
var	fs = require('fs'),
	util		= require('util'),
	path		= require('path'),
	publicDir	= "/../../public",
	debug		= require('debug')('dpd-fileupload'),
	formidable	= require('formidable'),
	md5			= require('md5'),
	mime		= require('mime'),

	Collection	= require('deployd/lib/resources/collection');

function Fileupload(name, options) {
	Collection.apply(this, arguments);
	
	// check to see if config has everything we need...
	if (!this.config.properties || !this.config.directory || !this.config.fullDirectory) {
		var dir = "_" + name;
		this.config.properties = {
			filesize: {
				name: "filesize",
				type: "number",
				typeLabel: "number",
				required: true,
				id: "filesize",
				order: 0
			},
			filename: {
				name: "filename",
				type: "string",
				typeLabel: "string",
				required: true,
				id: "filename",
				order: 0
			},
			originalFilename: {
				name: "originalFilename",
				type: "string",
				typeLabel: "string",
				required: true,
				id: "originalFilename",
				order: 0
			},
			subdir: {
				name: "subdir",
				type: "string",
				typeLabel: "string",
				required: false,
				id: "subdir",
				order: 0
			},
			creationDate: {
				name: "creationDate",
				type: "number",
				typeLabel: "number",
				required: true,
				id: "creationDate",
				order: 0
			},
			type: {
				name: "type",
				type: "string",
				typeLabel: "string",
				required: true,
				id: "type",
				order: 0
			}
		};
		this.properties = this.config.properties;
		
		this.config.directory = dir;
		this.config.fullDirectory = path.join(__dirname, publicDir, dir);
		
		// write the config file since it was apparently incomplete before
		fs.writeFile(path.join(options.configPath, 'config.json'), JSON.stringify(this.config), function(err) {
			if (err) throw err;
		});
	}
	
	// If the directory doesn't exist, we'll create it
	try {
		fs.statSync(this.config.fullDirectory).isDirectory();
	} catch (er) {
		fs.mkdir(this.config.fullDirectory);
	}
}

util.inherits(Fileupload, Collection);

Fileupload.events = ["Get", "Post", "Delete"];
Fileupload.dashboard = Collection.dashboard;

/**
 * Module methods
 */
Fileupload.prototype.handle = function (ctx, next) {
	ctx.query.id = ctx.query.id || this.parseId(ctx) || (ctx.body && ctx.body.id);
	var req = ctx.req,
		self = this;

	if (req.method === "POST") { // not clear what to do with PUTs yet...
		ctx.body = {};
		
		var form = new formidable.IncomingForm(),
			uploadDir = this.config.fullDirectory,
			resultFiles = [],
			remainingFile = 0;

		// Will send the response if all files have been processed
		var processDone = function(err, fileInfo) {
			if (err) return ctx.done(err);
			resultFiles.push(fileInfo);
			
			remainingFile--;
			if (remainingFile === 0) {
				debug("Response sent: ", resultFiles);
				return ctx.done(null, resultFiles); // TODO not clear what to do here yet
			}
		};

		// If we received params from the request
		if (typeof req.query !== 'undefined') {
			for (var propertyName in req.query) {
				debug("Query param found: { %j:%j } ", propertyName, req.query[propertyName]);

				if (propertyName === 'subdir') {
					debug("Subdir found: %j", req.query[propertyName]);
					uploadDir = path.join(uploadDir, req.query.subdir);
					// If the sub-directory doesn't exists, we'll create it
					try {
						fs.statSync(uploadDir).isDirectory();
					} catch (er) {
						fs.mkdir(uploadDir);
					}
				}
				
				ctx.body[propertyName] = req.query[propertyName];
			}
		}

		form.uploadDir = uploadDir;

		var renameAndStore = function(file) {
			fs.rename(file.path, path.join(uploadDir, file.name), function(err) {
				if (err) return processDone(err);
				debug("File renamed after event.upload.run: %j", err || path.join(uploadDir, file.name));
				
				ctx.body.filename = file.name;
				ctx.body.originalFilename = file.originalFilename;
				
				ctx.body.filesize = file.size;
				ctx.body.creationDate = new Date().getTime();

				// Store MIME type in object
				ctx.body.type = mime.lookup(file.name);
				
				self.save(ctx, processDone);
			});
		};

		form.parse(req)
			.on('file', function(name, file) {
				debug("File %j received", file.name);
				file.originalFilename = file.name;
				file.name = md5(Date.now()) + '.' + file.name.split('.').pop();
				
				renameAndStore(file);
			}).on('fileBegin', function(name, file) {
				remainingFile++;
				debug("Receiving a file: %j", file.name);
			}).on('error', function(err) {
				debug("Error: %j", err);
				return processDone(err);
			});
			
		return req.resume();
	} else if (req.method === "DELETE") {
		this.del(ctx, ctx.done);
	} else if (req.method === "PUT") {
		ctx.done({ statusCode: 400, message: "PUT not yet supported" });
	} else {
		Collection.prototype.handle.apply(this, [ctx, next]);
	}
};

// Delete a file
Fileupload.prototype.del = function(ctx, next) {
	var self = this;
	var uploadDir = this.config.fullDirectory;
	
	this.find(ctx, function(err, result) {
		if (err) return ctx.done(err);
		
		// let the collection handle the store... we just care about the files themselves
		self.remove(ctx, function(err) {
			if (err) return ctx.done(err);
			
			if (typeof result == 'undefined')
				result = [];
			else if (!Array.isArray(result))
				result = [result];
			
			var filesRemaining = result.length;
			
			var finishedFcn = function(err) {
				if (err) return ctx.done(err);
				filesRemaining--;
				
				if (filesRemaining === 0) {
					var filenames = result.map(function(r) {
						return r.originalFilename;
					});
					next({statusCode: 200, message: "File " + filenames + " successfuly deleted"});
				}
			};
			
			result.forEach(function(toDelete) {
				var filepath;
				if (toDelete.subdir)
					filepath = path.join(uploadDir, toDelete.subdir, toDelete.filename);
				else
					filepath = path.join(uploadDir, toDelete.filename);
				
				// actually delete the file, let the Collection methods handle events and whatever else
				debug('deleting file',filepath);
				fs.unlink(filepath, finishedFcn);
			});
		});
	});
};

/**
 * Module export
 */
module.exports = Fileupload;
