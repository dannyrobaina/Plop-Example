module.exports = function (plop) {

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
      templateFile: 'templates/controller.hbs',
    }]
  });

};