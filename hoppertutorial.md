bumblebee
=========


Tutorial compiled and edited from Matt Bonakdarpour, Roman Chyla, and Alexandra Holachek


dev-setup - linux
=================


The goal of this project is to implement a widget for the [Astrophysics Data System (ADS)](https://ui.adsabs.harvard.edu/) which displays concepts (e.g. galaxy formation, exoplanets, cosmology) appearing in given set of search results.

The front-end ADS platform for building widgets and displaying results is called [bumblebee](https://github.com/adsabs/bumblebee). The first step will be to clone the bumblebee repository, update a configuration file, and start the webserver:

1. ```bash
     $ git clone https://github.com/adsabs/bumblebee.git
   ```

1. ```bash
     $ sudo apt-get install node npm phantomjs
     $ sudo npm install -g grunt-cli

     # if you don't have 'node' but 'nodejs' (on DEBIAN), you also need:
     $ sudo apt-get install nodejs-legacy
   ```

   Now (inside the project), run:


   ```bash
     # install the dependencies from package.json
     $ sudo npm install
  
     # setup the project (libraries)
     $ sudo grunt setup 
   ```

1. ```bash
     $ cd bumblebee
     $ cp src/discovery.vars.js.default src/discovery.vars.js
   ```

1. Edit the src/discovery.vars.js file by replacing
   * apiRoot: '//api.adsabs.harvard.edu/v1/'
   with 
   * apiRoot: '//devapi.adsabs.harvard.edu/v1/'

1. ```bash
     $ cd bumblebee
     $ sudo grunt server
   ```

   Once the server's running, go to your browser (preferably chrome) and enter localhost:8000 in the address bar. You should see the ADS UI and you should be able to successfully make queries. 

   The creators of bumblebee made an official 'how to write a widget' tutorial that goes over testing and much more! Meanwhile, I've made an unofficial 'how to write a widget' tutorial that goes over getting a widget to appear on the search results page and how to get it to talk with a microservice.


how to write a widget (unofficial)
==================================


In this tutorial, we'll teach by example using the hello world widget generously provided by the creators of ADS.

First:

```bash
  $ git pull
```

Now, you can see for yourself the [hello world widget](/bumblebee/src/js/widgets/hello_world). This [widgets folder](/bumblebee/src/js/widgets) is also where the rest of the widgets appear to be.

To get the widget to appear on the search results page, we'll need to make edits in four locations:

1. /bumblebee/src/discovery.config.js
1. /bumblebee/src/js/apps/discovery/navigator.js
1. /bumblebee/src/js/wraps/results_page_manager.js
1. /bumblebee/src/js/page_managers/templates/results-page-layout.html

In [discovery.config.js](/bumblebee/src/discovery.config.js), you'll find where all of the widgets have been "named." These names are the way by which the widgets are referred to in other files (including the next three locations we'll edit). Add a comma to the end of the line of LibraryListWidget such that it looks like this:

* LibraryListWidget : 'js/widgets/library_list/widget',

In the next line, we add a name for our hello world widget as such:

* HelloWorld : 'js/widgets/lolol/widget'


Now, in [navigator.js](/bumblebee/src/js/apps/discovery/navigator.js), look for 

* var searchPageAlwaysVisible

and add in 'HelloWorld' to the list.


In [results_page_manager.js](/bumblebee/src/js/wraps/results_page_manager.js), you'll see

* persistentWidgets

where you should add in 'HelloWorld' as well.


Finally, [results-page-layout.html](/bumblebee/src/js/page_managers/templates/results-page-layout.html) is the file that decides where the widgets on the results page will appear (either left, middle, or right column). For the sake of easy viewing, add the following line:

* <div data-widget="HelloWorld"/>

to the section for the right-column widgets, the same column that has 

* <div data-widget="GraphTabs"/>


Now, when you load the ADS (via localhost:8000) and query something (e.g., "galaxy"), you should see the HelloWorld widget in the right column of the page.


how to write a widget (official)
================================


Alright! Let's develop a widget and let's do it quick!

First, basics - make sure we do the git stuff:

```bash
  $ git pull  # synchronize with the latest changes from github
  $ git checkout -b beautiful-widget  # create a new branch
```

Now, without thinking (doubting, criticizing, questioning our supreme authority!) create a test. Yes, you've heard well, we don't even have a widget to test, but we start from the test anyway:


```bash
  $ cp test/mocha/example_test.template.js test/mocha/js/widgets/beautiful_widget.spec.js
```  


And since we are lazy (which is virtue), we'll also create a ```sandbox``` test suite. This will
help us run tests quickly (and foremost, you will see the widget in action in no time!)

```bash
  $ cp test/mocha/suite.template.js test/mocha/sandbox.js
```

Now, edit your ```sandbox.js```:

```javascript
var tests  = [
    'test/mocha/widgets/beautiful_widget.spec.js'
  ];
``` 

Ok, we are almost done! Start the development server, open your browser and take a moment to congratulate yourself
(padding your shoulder...no, not on the head!)

```bash
  $ grunt server
  $ chrome http://localhost:8000/test/mocha/tests.html?bbbSuite=sandbox
```
  
You should see something like this:
  
  ![example test](/bumblebee/docs/img/hello-world-01.png)
  
  
If you don't see anything, then you have been paying too much attention to that lecture on quantum chromodynamics 
and screw things up! (@#$!) Open a developer console in your browser and look for errors, most likely paths are
wrong.


Next phase
==========

Congratulations! Almost done. Now you have to sit down and *actually* think what your widget is going to do. Write
the specification (the tests) down and then the widget itself.

I've prepared an (annoying heavily) annotated example which will guide you:

  - [hello world specs](/bumblebee/src/js/widgets/hello_world/widget.js)
  - [hello world widget](/bumblebee/test/mocha/js/widgets/hello_world_widget.js)
  
  
After the widget is ready, add it to the ui-suite.js and check it plays nicely with other widgets by visiting

http://localhost:8000/test/mocha/tests.html
http://localhost:8000/test/mocha/coverage.html

You should see 0 failures for the first link. And if you plan to submit a pull request, then at least 80% coverage
next to your widget name in the second page.

![hello world](/bumblebee/docs/img/hello-world-02.png)

You can get the test/coverage report also on command line

```bash
  $ sudo grunt coverage
```
  
I reassure you that writing a widget is much more fun that writing this how-to. Good job! Cheers, have fun!     
