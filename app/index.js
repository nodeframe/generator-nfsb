"use strict";

const generators = require('yeoman-generator');
const Git = require("nodegit");
const Promise = require('bluebird');
const mkdirp = Promise.promisify(require('mkdirp'));
const path = require('path');
const github = require('./githubApi');
const templateList = require('./template-list')();
const fs = require('fs');
const _ = require('lodash');

class NfsbGenerator extends generators.Base{

   constructor(){
     super(...arguments);
     this._repos = [];
     this._answer = {};
     this._projectFolder = 'project';
   }

   prompting(){
     var done = this.async();
      github.search({q:'user:nodeframe'}).then((res)=>{
       this._repos = res.items.map((v)=>{
         return {name:v.full_name,clone:v.clone_url}
       }).filter((r)=>{
         let v = r.name.split('/')[1];
         return (/\-boilerplate$/).test(v) && !(/^generator\-/).test(v);
       });

       this.prompt([{
         type    : 'input',
         name    : 'name',
         message : 'project name',
         default : 'project'
       },{
         type    : 'list',
         name    : 'template',
         message : 'choose template',
         choices : this._repos.map((v)=>v.name),
         filter  : function(val){
           return val.toLowerCase();
         }
       },{
         type    : 'input',
         name    : 'repo',
         message : 'repository'
       }]).then((ans)=>{
         this._answers = ans;
         done();
       });
     });
   }

   makeProjectDirectory(){
     this._projectFolder = _.kebabCase(this._answers.name);
     return mkdirp(this._projectFolder);
   }

   cloneBoilerplate(){
     let url = this._repos.find((v)=>v.name==this._answers.template).clone;
     return Git.Clone(url, this._projectFolder)
       .then((repo)=>{
         return Git.Remote.delete(repo, 'origin')
             .then(()=>Git.Remote.create(repo,'prototype',url))
             .then(()=>(this._answers.repo && this._answers.repo !== '') && Git.Remote.create(repo,'origin',this._answers.repo))
       });
   }

   editProjectName(){
     try{
       let package_path = path.resolve(this._projectFolder,'package.json');
       let json = fs.readFileSync(package_path);
       let o = JSON.parse(json.toString());
       o.name = this._projectFolder;
       fs.writeFileSync(package_path,JSON.stringify(o,null,'  '));
     }catch(e){
       console.log('cannot edit package.json');
     }
   }

}

module.exports = NfsbGenerator;
