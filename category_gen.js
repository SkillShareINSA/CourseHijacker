var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var options = {
  host: 'moodle.insa-toulouse.fr',
  path: '/'
};

var callbackCategory = function(response) {
  var str = '';
  var category = [];

  var extractCoursesNum = function (num) {
    if (num.length) {
      return parseInt(num.substr(2,1));
    } else {
      return 0;
    }
  };

  var walkCategoryDOM = function(node, parentId) {

    var nodeInfo = node.children('.info');
    var nodeContent = node.children('.content');
    var categoryId = node.data('categoryid');
    category.push({
      _id: categoryId,
      name: nodeInfo.find('a').text(),
      parent_id: parentId,
      courses_num: extractCoursesNum(nodeInfo.find('.numberofcourse').text())
    });
    console.log('Category ' + categoryId + ' : ' + nodeInfo.find('a').text() + ', parent = ' + parentId);

    if (!nodeContent.is(':empty')) {
      nodeContent
        .children('.subcategories')
        .children('.category')
        .each(function(k,v) {
          var node = $(v);
          walkCategoryDOM(node, categoryId);
        });
    }
  };

  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    $ = cheerio.load(str);
    $('#frontpage-category-names')
      .children('.frontpage-category-names')
      .children('.content')
      .children('.subcategories')
      .children('.category')
      .each(function (k, v) {
        var node = $(v);
        walkCategoryDOM(node, 0);
    });

    var stream = fs.createWriteStream('category.json');
    stream.once('open', function(fd) {
      for (var i = 0; i < category.length; i++) {
        stream.write(JSON.stringify(category[i]) + '\n');
      }
      stream.end();
    });
  });
};
http.request(options , callbackCategory).end();
