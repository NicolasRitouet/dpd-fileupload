File uploader Module for Deployd [![NPM](https://nodei.co/npm/dpd-fileupload.png?compact=true)](https://npmjs.org/package/dpd-fileupload/)
=========================
[A working demo is available.](https://github.com/NicolasRitouet/dpd-fileupload-demo)

## Description
This module provides functionnality to upload files within Deployd.
The uploaded files will be stored in the public folder of Deployd and the filenames will be stored in a collection.

Don't hesitate to [fill an issue](https://github.com/NicolasRitouet/dpd-fileupload/issues/new) if you find a bug or need a feature.

## Installation

Go to the base directory of your Deployd project and enter:

```shell
$ npm install dpd-fileupload --save
```

Once installed, you can add a resource of type fileupload in the dashboard.
![Installaton](https://raw2.github.com/NicolasRitouet/nicolasritouet.github.io/master/images/dashboard-choose-resource.png)

## Configuration
By default, the module will create a folder called "upload" inside the public directory. You can then access your files by calling: http://localhost:2403/upload/filename.extension
![Directory structure](https://raw2.github.com/NicolasRitouet/nicolasritouet.github.io/master/images/directory-structure.png)

If you need to, you can change the name of the directory in the dashboard under CONFIG.
![Configuration](https://raw2.github.com/NicolasRitouet/nicolasritouet.github.io/master/images/dashboard-config.png)

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
    optionalParam:'foobar'
}, {
	filename: 'screenshot (1).png',
    subdir: "images",
    creationDate: 1389946339233,
    id: 'ef43f52310e2bbae',
    optionalParam:'foobar'
}, ...]
```

### Get the list of files
Method GET

```js
dpd.fileupload.get(function(err, result) {
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
    optionalParam:'foobar'
}, {
	filename: 'screenshot (1).png',
    subdir: "images",
    creationDate: 1389946339233,
    id: 'ef43f52310e2bbae',
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
    dpd.fileupload.delete(id, function(err, result) {
        if (err) alert(err);
        console.log(result);
    });
```


## Changelog
- [0.0.8](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.8)
    - any parameter send in the query will be stored in the resource (and parse a JSON text to produce an object or array)
    - if a parameter property name is "subdir", file will be placed under this subdir in the upload directory
- [0.0.7](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.7)
    - fix empty response issue
- [0.0.6](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.6)
- [0.0.5](https://github.com/NicolasRitouet/dpd-fileupload/releases/tag/0.0.5)

Todo
----
- add tests
- [improve demo](https://github.com/NicolasRitouet/dpd-fileupload-demo) (add implementation with angularJS, send a param in the query)
- check if file already exist (upload anyway and put a (1) in the filename or return an error?)
- Find a cleaner way to get the path of the upload directory
- Implement GET of one file (stream file ?)
