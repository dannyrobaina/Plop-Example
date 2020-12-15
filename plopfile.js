module.exports = function (plop) {
  const { readdirSync } = require('fs')

  const getDirectories = source =>
    readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  
  const getFileNames = source =>
    readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent && !dirent.isDirectory() && dirent.name && dirent.name.endsWith('.js'))
      .map(dirent => dirent.name.slice(0, dirent.name.length - 3));

  const controllerDirPath = `${process.cwd()}/controllers`;
  const controllerDirs = getDirectories(controllerDirPath);

  const routesDirPath = `${process.cwd()}/routes`;
  const routeFiles = getFileNames(routesDirPath);

  plop.addPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

  plop.setGenerator('controller', {
    description: 'application controller',

    // inquirer prompts
    prompts: [{
      type: 'input',
      name: 'name',
      message: 'Controller name?'
    }],

    // actions to perform
    actions: [{
      type: 'add',
      path: 'src/controllers/{{dashCase name}}.js',
      templateFile: 'plop-templates/new-router.js',
    }]
  });

  plop.setGenerator('new-router', {
    description: 'create new router file for application',
    
    prompts: [{
      type: 'input',
      name: 'routerName',
      message: 'Router name?'
    },
    {
      type: 'input',
      name: 'routerPath',
      default: '/{{routerName}}',
      message: 'Router path?'
    }],

    // actions to perform
    actions: [{
      type: 'add',
      path: 'routes/{{routerName}}.js',
      templateFile: 'plop-templates/new-router.js'
    },
    {
      type: 'append',
      path: 'app.js',
      pattern: /(\/\/use for plop DO NOT REMOVE)/gi,
      template: 'app.use(\'{{routerPath}})'
    }]
  });

  plop.setGenerator('new-router', {
    description: 'create new router file for application',

    prompts: async function (inquire) {
      // getting route name from first prompt
      const routerNameAnswer = await inquire.prompt({
        type: 'input',
        name: 'routerName',
        message: 'Type router name:'
      });

      // displaying answer as default
      const routerPathAnswer = await inquire.prompt({
        type: 'input',
        name: 'routerPath',
        default: routerNameAnswer.routerName,
        message: `Type router path:`
      });

      //combining both answers into one object
      const answers = Object.assign({}, routerPathAnswer, routerNameAnswer);
      return answers;
    },

    actions: [{
      type: 'add',
      path: 'routes/{{routerName}}.js',
      templateFile: 'plop-templates/new-router.js'
    },
    {
      type: 'append',
      path: 'app.js',
      pattern: /(use for plop imports DO NOT REMOVE OR CHANGE)/gi,
      template: 'const {{routerName}} = require(\'./routes/{{routerName}}\');'
    },
    {
      type: 'append',
      path: 'app.js',
      pattern: /(use for plop routes DO NOT REMOVE OR CHANGE)/gi,
      template: 'app.use(\'/{{routerPath}}\', {{routerName}});'
    }]
  });

  plop.setGenerator('new-controller', {
    description: 'create new controller fole for application',

    // prompting user
    prompts: async function (inquire) {
      const firstAnswerSet = await inquire.prompt([{
        type: 'input',
        name: 'controllerName',
        message: 'Type controller name:',
        validate: function(val) {
          return val ? true : 'You must type a value'
        }
      },
      {
        type: 'autocomplete',
        name: 'controllerDir',
        suggestOnly: 'true',
        message: 'Type existing or new controller dir:',
        source: async function (answers, input) {
          const filterDirs = controllerDirs.filter(dir => dir && dir.indexOf(input) !== -1);
          return filterDirs;
        },
        validate: function(val) {
          return val ? true : 'You must type a value'
        }
      },
      // add here propmt to confirm if they want to use new controller dir
      {
        type: 'confirm',
        name: 'addToRouter',
        message: 'Add controller to router?',
        validate: function(val) {
          return val ? true : 'You must type a value'
        }
      }]);
      // finish asking prompt if user does not wish to add controller to router file
      if (!firstAnswerSet.addToRouter) {
        return firstAnswerSet;
      }

      // asking user if they want to use existing router or new router
      const secondAnswerSet = inquire.prompt([{
        type: 'confirm',
        name: 'useExistingRouter',
        message: 'Add controller to existing router?',
        validate: function(val) {
          return val ? true : 'You must type a value'
        }
      }]);

      let thirdAnswerSet;
      if (secondAnswerSet.useExistingRouter) {
        thirdAnswerSet = await inquire.prompt([{
          type: 'autocomplete',
          name: 'routerName',
          message: 'select existing router to add controller to:',
          source: async function (answers, input) {
            return routeFiles.filter(file => file && file.indexOf(input) !== -1);
          }
        }]);
      } else {
        thirdAnswerSet = await inquire.prompt([{
          type: 'input',
          name: 'routerName',
          message: 'type new router to add to controller to:'
        }]);
      }
      return Object.assign({}, firstAnswerSet, secondAnswerSet, thirdAnswerSet);
    },

    actions: function (answers) { 
      const actions = [{
        type: 'add',
        path: 'controllers/{{controllerDir}}/{{controllerName}}.js',
        templateFile: 'plop-templates/new-controller.js'
      }];
      if (answers.addToRouter) {
        if (answers.useExistingRouter) {
          actions.push({
            type: 'modify',
            path: 'routes/{{routerName}}.js',
            pattern: ' '
          });
        } else {
          actions.push({
            type: 'add',
            path: 'routes/{{routerName}}.js',
            templateFile: 'plop-templates/new-router.js'
          });
        }
      }
      return actions;
    }
  });

};