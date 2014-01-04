File uploader for Deployd
=========================

Module for Deployd to upload files.


Installation
------------

Go to the base directory of your Deployd project and enter:

    npm install dpd-fileupload --save


Configuration
-------------
You have to create a directory in the "public" directory of your project (default is "upload") and set its name into the dashboard settings.

Notes
-----
Currently, you have to set the content type to "multipart/form-data".
Only UPLOAD (POST OR PUT) and DELETE works.
GET is planned, we could remove the upload directory from public and stream the files, that would allow to add some restrictions.

Todo
----
- Allow to send an optional filename as parameter
- Clean returned values (in case of multiple files, headers already sent)
- Find a better way to get the path of the upload directory
- Implement GET