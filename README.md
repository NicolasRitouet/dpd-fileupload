# File uploader Module for Deployd
[![npm](http://img.shields.io/npm/v/dpd-fileupload.svg?style=flat-square)](https://www.npmjs.com/package/dpd-fileupload/) [![David](http://img.shields.io/david/nicolasritouet/dpd-fileupload.svg?style=flat-square)](https://david-dm.org/nicolasritouet/dpd-fileupload) [![Build Status](https://img.shields.io/travis/NicolasRitouet/dpd-fileupload.svg?style=flat-square)](https://travis-ci.org/NicolasRitouet/dpd-fileupload)
=========================
[Check out this repo for a demo of this module.](https://github.com/NicolasRitouet/dpd-fileupload-demo)

## Description
This module provides functionality to upload files within Deployd.
The uploaded files will be stored in the public folder of Deployd and the filenames will be stored in a collection.

Don't hesitate to [fill an issue](https://github.com/NicolasRitouet/dpd-fileupload/issues/new) if you find a bug or need a feature.

## Installation

Go to the base directory of your Deployd project and enter:

```shell
$ npm install deployd
$ npm install dpd-fileupload --save
```

Once installed, you can add a resource of type fileupload in the dashboard.
![Installaton](https://raw.githubusercontent.com/NicolasRitouet/nicolasritouet.github.io/master/images/dashboard-choose-resource.png)

## Development

```shell
$ git clone git@github.com:NicolasRitouet/dpd-fileupload.git
$ cd dpd-fileupload
$ npm install deployd
$ npm link
```

## Configuration
By default, the module will create a folder called "upload" inside the public directory. You can then access your files by calling: http://localhost:2403/upload/filename.extension
![Directory structure](https://raw.githubusercontent.com/NicolasRitouet/nicolasritouet.github.io/master/images/directory-structure.png)

If you need to, you can change the name of the directory in the dashboard under CONFIG.
![Configuration](https://raw.githubusercontent.com/NicolasRitouet/nicolasritouet.github.io/master/images/dashboard-config.png)

## Usage
### Upload a file (or multiple files)
Method POST or PUT (set content type to "multipart/form-data"), send "subdir" as request param to save the file in a sub directory.
Any request parameter sent will be stored in the resource object.

Working demo available here: https://github.com/NicolasRitouet/dpd-fileupload-demo

Response of a successful upload:
```
[{
	filename: 'screenshot.png',
    subdir: "images",
    creationDate: 1389946339569,
    id: '2f4c752310e2bbae',
    filesize: '75148412',
    optionalParam:'foobar'
}, {
	filename: 'screenshot (1).png',
    subdir: "images",
    creationDate: 1389946339233,
    id: 'ef43f52310e2bbae',
    filesize: '85412',
    optionalParam:'foobar'
}, ...]
```

### Get the list of files
Method GET

```js
dpd.fileupload.get(function(result, err) {
    console.log(result);
});
```
The response:
```
[{
	filename: 'screenshot.png',
    subdir: "images",
    creationDate: 1389946339569,
    id: '2f4c752310e2bbae',
    filesize: '75148412',
    optionalParam:'foobar'
}, {
	filename: 'screenshot (1).png',
    subdir: "images",
    creationDate: 1389946339233,
    id: 'ef43f52310e2bbae',
    filesize: '8441547',
    optionalParam:'foobar'
}, ...]
```

### Get one file
Since we upload the files into the /public folder, you can access your files like this:
http://localhost:2403/upload/subdir/filename.extension
replace:
- "upload" by the folder your set in the dashboard
- "subdir" by the value you set for subdir. (nothing if you haven't given a subdir param)
- "filename.extension" by the name of the file your uploaded

If you would like more security and some rights management to get the files, [fill an issue](https://github.com/NicolasRitouet/dpd-fileupload/issues/new) about this and I might work on this feature.


### Remove a file from filesystem and from collection
Method DELETE

```js
    dpd.fileupload.del(id, function(result, err) {
        if (err) alert(err);
        console.log(result);
    });
```
## events
This module provides three custom events in the dashboard: `get`, `upload`, `delete`  
They contains the following variables:
-  `ctx`: more documentation on [docs.deployd.com](http://docs.deployd.com/docs/collections/reference/event-api.html#s-ctx <!-- ctx -->-764)
-  the `upload` event also contains the following objects:
	- `url`
	- `filename`
	- `originalFilename`
	- `filesize`
	- `uniqueFilename`
	- `subdir`

[Example on dpd-fileupload-demo](https://github.com/NicolasRitouet/dpd-fileupload-demo/blob/master/resources/upload/upload.js)

## authentication
Thanks to [@Mortgy](https://github.com/Mortgy), we now have authentication within `dpd-fileupload`.  
There's a new checkbox in the dashboard to configure the authorization. If you need your users to be logged-in to view, upload or delete the files, this checkbox is yours!
If your users are logged-in with `deployd`, they'll have access to the resources.


## Changelog
- [0.0.17](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/v0.0.17)  
	- Implemented user authentication configuration to allow file uploading / deleting for loggedin users [PR #43](https://github.com/NicolasRitouet/dpd-fileupload/pull/43) (Thanks [@Mortgy](https://github.com/Mortgy))
	- unique filename enabling could be configured in configuration [PR #43](https://github.com/NicolasRitouet/dpd-fileupload/pull/43) (Thanks [@Mortgy](https://github.com/Mortgy))
- [0.0.16](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/v0.0.16)  
	- add single file get #40 [PR #40](https://github.com/NicolasRitouet/dpd-fileupload/pull/40) (Thanks [@EvilDrW](https://github.com/EvilDrW))
- [0.0.15](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/v0.0.15)  
	- Add data in upload event.
	- Partial fix of `E11000 error` [PR #36](https://github.com/NicolasRitouet/dpd-fileupload/pull/36) (Thanks [@hjanuschka](https://github.com/hjanuschka)). The rest of the fix is on Deployd side ([#653](https://github.com/deployd/deployd/issues/653))
	- Switch to new md5 dependency (MD5 was deprecated). [PR #31](https://github.com/NicolasRitouet/dpd-fileupload/pull/31)
	- We now have integration tests, maintainance will be much easier :sunglasses:
- [0.0.14](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.14)  
  - Fixed path issues with lots of traffic. [PR #25](https://github.com/NicolasRitouet/dpd-fileupload/pull/25) (thanks [@rgolea](https://github.com/rgolea))
- [0.0.13](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.13)  
  - Fixed bug for deleting without a subdirectory. [PR #22](https://github.com/NicolasRitouet/dpd-fileupload/pull/22) (thanks [@rgolea](https://github.com/rgolea))
  - Upgrade dependency (`debug` module).
- [0.0.12](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.12)  
  - fix: public folder not dynamic. [PR #19](https://github.com/NicolasRitouet/dpd-fileupload/pull/19) (thanks @docnoe)
  - Update dependencies. Close #17
  - rename mimeType property to type to match the html5 file spec. Close #14
- [0.0.11](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.11)
    - Allow internal requests for GET. Close #12
    - Added MIME types and filtering file lists. PR #5
- [0.0.10](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.10)
    - Option to store unique file name (add uniqueFilename to the query param. [Cf Demo](https://github.com/NicolasRitouet/dpd-fileupload-demo/blob/master/public/js/main.js#L17))
    - * npm update required ([MD5](https://github.com/pvorb/node-md5) dependency added)
    - if the name of the resource is the same of the upload directory, it'll automatically append an underscore (_) to the upload directory (cf demo)
- [0.0.9](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.9)
    - Store file size
- [0.0.8](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.8)
    - any parameter send in the query will be stored in the resource (and its value will be parsed as JSON if applicable)
    - if a parameter property name is "subdir", file will be placed under this subdir in the upload directory
- [0.0.7](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.7)
    - fix empty response issue
- [0.0.6](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.6)
- [0.0.5](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.5)

Todo
----
- send an event with progress of upload=
- [improve demo](https://github.com/NicolasRitouet/dpd-fileupload-demo) (add implementation with angularJS, send a param in the query)
- check if file already exist (upload anyway and put a (1) in the filename or return an error?)
- Find a cleaner way to get the path of the upload directory
- Implement GET of one file (stream file ?)
