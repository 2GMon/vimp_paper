let INFO = xml`
<plugin name="vimp_paper" version="0.0.1"
        href=""
        lang="ja"
        summary="instapaper操作"
        xmlns="">
  <author email="2gmon.t@gmail.com">2GMon</author>
  <license href="http://opensource.org/licenses/mit-license.php">MIT</license>
  <project name="Vimperator" minVersion="2.3"/>
  <p>
    これはinstapaperを操作するためのプラグインです。
  </p>
</plugin>`;

function EncodeHTMLForm( data )
{
    var params = [];
    for( var name in data )
    {
        var value = data[ name ];
        var param = encodeURIComponent( name ).replace( /%20/g, '+' )
            + '=' + encodeURIComponent( value ).replace( /%20/g, '+' );

        params.push( param );
    }
    return params.join( '&' );
}

addUrl = function (args) {
    var options = {
        'url' : 'https://www.instapaper.com/api/add',
        'method' : 'POST',
    }
    var params = {
        'username' : liberator.globalVariables.instapaper_username,
        'password' : liberator.globalVariables.instapaper_password,
        'url' : args
    }
    var request = new XMLHttpRequest();
    request.open(options.method, options.url, false);
    request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    request.send(EncodeHTMLForm(params));
    if (request.responseText == "201") {
        liberator.echo("This URL has been successfully added to this Instapaper account.");
    } else if (request.responseText == "400") {
        liberator.echoerr("Bad request or exceeded the rate limit. Probably missing a required parameter, such as url.");
    } else if (request.responseText == "403") {
        liberator.echoerr("Invalid username or password.");
    } else if (request.responseText == "500") {
        liberator.echoerr("The service encountered an error. Please try again later.");
    } else {
        liberator.echoerr("Unknown Error");
    }
};

commands.addUserCommand(["instapaper", "ip"], "instapaper",
  function action(args) {
  }, {
    subCommands: [
      new Command(["add"], "Description", addUrl, {}),
      new Command(["list"], "Description", function (args) {}, {}),
    ],
  },
  true
);
