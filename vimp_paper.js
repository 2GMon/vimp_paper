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
    request.open(options.method, options.url, true);
    request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    request.onload = function(e) {
        if (request.status == "201") {
            liberator.echo("This URL has been successfully added to this Instapaper account.");
        } else if (request.status == "400") {
            liberator.echoerr("Bad request or exceeded the rate limit. Probably missing a required parameter, such as url.");
        } else if (request.status == "403") {
            liberator.echoerr("Invalid username or password.");
        } else if (request.status == "500") {
            liberator.echoerr("The service encountered an error. Please try again later.");
        } else {
            liberator.echoerr(request.responseText);
        }
    }
    request.onerror = function(e) {
        liberator.echoerr("Unknown Error.");
    }
    request.send(EncodeHTMLForm(params));
};

fetchInstapaper = function () {
  var request = new XMLHttpRequest();
  request.open("GET", "https://www.instapaper.com/u", false);
  request.send();
  var parser = new DOMParser();
  var dom = parser.parseFromString(request.responseText, "text/html");

  return dom;
};

getTitleList = function (dom) {
  var title_list = [];
  var articles = dom.getElementsByClassName("article_item");
  for each (var article in articles) {
    if (Object.prototype.toString.call(article) == "[object HTMLElement]") {
      var titles = article.getElementsByClassName("article_title");
      var title = titles[0].getAttribute("title");
      title_list.push(title);
    }
  }

  return title_list;
};

getUrlList = function (dom) {
  var url_list = [];
  var articles = dom.getElementsByClassName("article_item");
  for each (var article in articles) {
    if (Object.prototype.toString.call(article) == "[object HTMLElement]") {
      var titles = article.getElementsByClassName("js_domain_linkout");
      var url = titles[0].getAttribute("href");
      url_list.push(url);
    }
  }

  return url_list;
}

getIdList = function (dom) {
  var id_list = [];
  var articles = dom.getElementsByClassName("article_item");
  for each (var article in articles) {
    if (Object.prototype.toString.call(article) == "[object HTMLElement]") {
      var id = article.getAttribute("data-article-id");
      id_list.push(id);
    }
  }

  return id_list;
}

deleteId = function (id) {
  var options = {
      'url' : 'https://www.instapaper.com/delete_articles',
      'method' : 'POST',
  };
  var params = {};
  params[id] = null;
  var request = new XMLHttpRequest();
  request.open(options.method, options.url, true);
  request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
  request.onload = function(e) {
      if (request.status == "200") {
          liberator.echo("This URL has been successfully deleted from this Instapaper account.");
      } else {
          liberator.echoerr("Unknown Error " + request.responseText);
      }
  }
  request.send(JSON.stringify([id]));
}

openCompleter = function(context) {
    var dom = fetchInstapaper();
    var title_list = getTitleList(dom);
    var url_list = getUrlList(dom);
    var cs = [];
    for (i = 0; i < title_list.length; i++) {
        cs.push([url_list[i], title_list[i]]);
    }
    context.compare = void 0;
    context.title = ["url", "title"];
    context.completions = cs;
}

deleteCompleter = function(context) {
    var dom = fetchInstapaper();
    var title_list = getTitleList(dom);
    var url_list = getUrlList(dom);
    var id_list = getIdList(dom);
    var cs = [];
    for (i = 0; i < title_list.length; i++) {
        cs.push([url_list[i] + "," + id_list[i], title_list[i]]);
    }
    context.compare = void 0;
    context.title = ["url, id", "title"];
    context.completions = cs;
}

function printProperties(obj) {
    var properties = '';
    for (var prop in obj){
        properties += prop + "=" + obj[prop] + "\n";
    }
    alert(properties);
}

commands.addUserCommand(["instapaper", "ip"], "instapaper",
  function action(args) {
  }, {
    subCommands: [
      new Command(["add"], "Description", addUrl, {}),
      new Command(["open"], "open page",
        function (args) {
          liberator.open(args, liberator.NEW_BACKGROUND_TAB);
        },
        { completer: openCompleter }
      ),
      new Command(["delete", "del"], "delete page from instapaper",
        function (args) {
          var args = args[0].split(",");
          var url = args[0];
          var id = args[1];
          deleteId(id);
        },
        { completer: deleteCompleter }
      ),
      new Command(["deleteandopen", "dao"], "open page and delete page from instapaper",
        function (args) {
          var args = args[0].split(",");
          var url = args[0];
          var id = args[1];
          deleteId(id);
          liberator.open(url, liberator.NEW_BACKGROUND_TAB);
        },
        { completer: deleteCompleter }
      ),
    ],
  },
  true
);
