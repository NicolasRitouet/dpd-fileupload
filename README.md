File uploader for Deployd
=========================

Module for Deployd to upload files.


Installation
------------
Currently, this module is not on npm yet, to install it manually, copy "index.js" in your node_modules of your deployd project and run this to install the dependencies:

    npm install

When this module is on npm:

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