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
- fix remove bug (file is not removed from collection)
- add client example
- Allow to send an optional filename as parameter
- send an event when file is uploaded
- Clean returned values (in case of multiple files, fix "headers already sent" error)
- Find a better way to get the path of the upload directory
- Implement GET of one id (stream file)
- allow to store files in subdir as optional parameter
