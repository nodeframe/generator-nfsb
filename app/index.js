"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var generators = require('yeoman-generator');
var Git = require("nodegit");
var Promise = require('bluebird');
var mkdirp = Promise.promisify(require('mkdirp'));
var path = require('path');
var github = require('./githubApi');
var templateList = require('./template-list')();
var fs = require('fs');
var _ = require('lodash');

var NfsbGenerator = function (_generators$Base) {
  _inherits(NfsbGenerator, _generators$Base);

  function NfsbGenerator() {
    _classCallCheck(this, NfsbGenerator);

    var _this = _possibleConstructorReturn(this, (NfsbGenerator.__proto__ || Object.getPrototypeOf(NfsbGenerator)).apply(this, arguments));

    _this._repos = [];
    _this._answer = {};
    _this._projectFolder = 'project';
    return _this;
  }

  _createClass(NfsbGenerator, [{
    key: "prompting",
    value: function prompting() {
      var _this2 = this;

      var done = this.async();
      github.search({ q: 'user:nodeframe' }).then(function (res) {
        _this2._repos = res.items.map(function (v) {
          return { name: v.full_name, clone: v.clone_url };
        }).filter(function (r) {
          var v = r.name.split('/')[1];
          return (/\-boilerplate$/.test(v) && !/^generator\-/.test(v)
          );
        });

        _this2.prompt([{
          type: 'input',
          name: 'name',
          message: 'project name',
          default: 'project'
        }, {
          type: 'list',
          name: 'template',
          message: 'choose template',
          choices: _this2._repos.map(function (v) {
            return v.name;
          }),
          filter: function filter(val) {
            return val.toLowerCase();
          }
        }, {
          type: 'input',
          name: 'repo',
          message: 'repository'
        }]).then(function (ans) {
          _this2._answers = ans;
          done();
        });
      });
    }
  }, {
    key: "makeProjectDirectory",
    value: function makeProjectDirectory() {
      this._projectFolder = _.kebabCase(this._answers.name);
      return mkdirp(this._projectFolder);
    }
  }, {
    key: "cloneBoilerplate",
    value: function cloneBoilerplate() {
      var _this3 = this;

      var url = this._repos.find(function (v) {
        return v.name == _this3._answers.template;
      }).clone;
      return Git.Clone(url, this._projectFolder).then(function (repo) {
        return Git.Remote.delete(repo, 'origin').then(function () {
          return Git.Remote.create(repo, 'prototype', url);
        }).then(function () {
          return _this3._answers.repo && _this3._answers.repo !== '' && Git.Remote.create(repo, 'origin', _this3._answers.repo);
        });
      });
    }
  }, {
    key: "editProjectName",
    value: function editProjectName() {
      try {
        var package_path = path.resolve(this._projectFolder, 'package.json');
        var json = fs.readFileSync(package_path);
        var o = JSON.parse(json.toString());
        o.name = this._projectFolder;
        fs.writeFileSync(package_path, JSON.stringify(o, null, '  '));
      } catch (e) {
        console.log('cannot edit package.json');
      }
    }
  }]);

  return NfsbGenerator;
}(generators.Base);

module.exports = NfsbGenerator;
//# sourceMappingURL=index.js.map