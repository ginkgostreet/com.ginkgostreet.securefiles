CRM.$(function ($) {

  CRM.SecureFilesWidget.formComplete = false;

  function uploadFileWithPromise(file, key, field) {

    var dfd = $.Deferred();

    var params = {
      Key: key,
      ContentType: file.type,
      Body: file
      //todo: Add server-side Encryption Settings
    };
    CRM.SecureFilesWidget.Bucket.putObject(params, function (err, data) {
      if (err) {
        dfd.reject(err);
      } else {
        dfd.resolve({"field": field, "name": key, "mime-type": file.type, "data": data});
      }
    });


    return dfd.promise();
  }

  $(".securefiles_upload").closest("form").submit(function(event) {
    var formObj = $(this);
    if(!CRM.SecureFilesWidget.formComplete) {
      event.preventDefault();
      if (CRM.SecureFilesWidget.useSTS) {
        //Upload the file using the JavaScript SDK
        CRM.SecureFilesWidget.promises = [];
        $(this).find(".securefiles_upload").each(function () {

          var i = 0;
          if(this.files[i]) {
            //Looks like we have something to upload
            var file = this.files[i];
            var fileTitle = CRM.SecureFilesWidget.S3Fields[$(this).attr("name")].filename || this.files[i].name;
            var objKey = CRM.SecureFilesWidget.currentContactId + '/' + fileTitle;

            CRM.SecureFilesWidget.promises.push(uploadFileWithPromise(this.files[i], objKey, $(this).attr("name")));


          }
        });

        $.when.apply($, CRM.SecureFilesWidget.promises).done(function(data) {
          CRM.SecureFilesWidget.formComplete = true;
          formObj.find(".securefiles-metadata").val(JSON.stringify(data));
          //Todo: Clear the file field so it doesn't attempt to upload
          formObj.submit();
        }).fail(function(err) {
          console.log(err);
        });

      }
    }
  });




  //Setup Creds for S3 if we need them.
  if(CRM.SecureFilesWidget.useSTS) {

    AWS.config.update({
      accessKeyId: CRM.SecureFilesWidget.Credentials.AccessKeyId,
      secretAccessKey: CRM.SecureFilesWidget.Credentials.SecretAccessKey,
      sessionToken: CRM.SecureFilesWidget.Credentials.SessionToken
    });

    AWS.config.region = CRM.SecureFilesWidget.S3Region;

    //This tells the js sdk to log debugging symbols to the console
    //AWS.config.logger = console;

    CRM.SecureFilesWidget.Bucket = new AWS.S3({
      params: {
        Bucket: CRM.SecureFilesWidget.S3Bucket
      }
    });
  }

});