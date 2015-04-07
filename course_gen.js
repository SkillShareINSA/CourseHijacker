var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var GETOpts = {
  host: 'moodle.insa-toulouse.fr',
  path: '/'
};
var GETCourseOpts = function(categoryId) {
  return {
    host: 'moodle.insa-toulouse.fr',
    path: '/course/index.php?categoryid=' + categoryId
  }
};
var courses = [];

var callbackCourse = function(res, stream, categoryId) {
  var str = '';

  res.on('data', function (chunk) {
    str += chunk;
  });
  res.on('end', function () {
    var dom = cheerio.load(str);
    dom('.coursebox').each(function (k, v) {
      var node = dom(v);
      var nodeLink = dom(v).children('.info').find('a');
      var teachersList = [];
      dom('ul.teachers li').each(function (_, value) {
        teachersList.push(dom(value).find('a').text());
      });
      var courseId = node.data('courseid');
      stream.write(JSON.stringify({
        _id: courseId,
        name: nodeLink.text(),
        url: nodeLink.attr('href'),
        teachers: teachersList,
        parent_id: categoryId
      }) + "\n");
      courses.push();
    });
  });
};

var callbackCategory = function(response) {
  var str = '';

  var extractCoursesNum = function (num) {
    if (num.length) {
      return parseInt(num.substr(2,1));
    } else {
      return 0;
    }
  };

  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {

    console.log('Getting default page');
    $ = cheerio.load(str);
    var stream = fs.createWriteStream('course.json');
    stream.once('open', function(fd) {
      $('.category').each(function (k, v) {
        var node = $(v);
        var nodeInfo = node.children('.info');
        var categoryId = node.data('categoryid');
        if (extractCoursesNum(nodeInfo.find('.numberofcourse').text()) > 0) {
          console.log(nodeInfo.find('a').attr('href'));
          http.request(GETCourseOpts(categoryId),
            function (res) {
              callbackCourse(res, stream, categoryId);
            }).end();
        }
      });
    });
  });
};
http.request(GETOpts, callbackCategory).end();
