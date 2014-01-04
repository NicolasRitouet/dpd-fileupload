File uploader for Deployd
=========================

Module for Deployd to upload files.
Upload the files to a local folder (currently in the public folder to access them) and store the filenames in a collection.

This module is higly unstable, use it at your own risk.
Don't hesitate to contact me if you have some specifics needs for this.


Installation
------------

Go to the base directory of your Deployd project and enter:

    npm install dpd-fileupload --save


Configuration
-------------
You have to create a directory in the "public" directory of your project (default is "upload") and set its name into the dashboard settings.

Usage
-----
### Upload a file
Method POST or PUT (set content type to "multipart/form-data")
    todo add example

### Get the list of files
Method GET

    dpd.fileupload.get(function(err, result) {
        console.log(result);
    });


### Remove a file from filesystem and from collection
Method DELETE

    dpd.fileupload.delete({filename: "README.md"}, function(err, result) {
        if (err) alert(err);
        console.log(result);
    });

Notes
-----
Currently, you have to set the content type to "multipart/form-data".
GET of one item is planned. That would allow us to remove the upload directory from public and stream the files and increase security by adding some restrictions.

Todo
----
- check if file already exist (upload anyway and put a (1) in the filename ?)
- add client example
- Allow to send an optional filename as parameter
- Allow "subdir" optional param to store the file in a given sub directory
- Fix callback problem when multiple files are uploaded (response contains only one file, but all are correctly uploaded and stored)
- send an event when file is uploaded
- Find a better way to get the path of the upload directory
- Implement GET of one file (stream file ?)
