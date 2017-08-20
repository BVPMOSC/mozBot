// config.json as it is
var bl = require('bl');
var config = require('./config');
var express = require('express');
var fs = require('fs');
var util = require('util');

var GitHubApi = require('github');
var jsonlint = require('jsonlint');



if (!process.env.GITHUB_TOKEN) {
  console.error('The bot was started without a GitHub account to post with.');
  console.error('To get started:');
  console.error('1) Create a new account for the bot');
  console.error('2) Settings > Personal access tokens > Generate new token');
  console.error('3) Only check `public_repo` and click Generate token');
  console.error('4) Run the following command:');
  console.error('GITHUB_TOKEN=insert_token_here npm start');
  console.error('5) Run the following command in another tab:');
  console.error('curl -X POST -d @__tests__/data/23.webhook http://localhost:5000/');
  console.error('6) Check if it has commented here: https://github.com/fbsamples/bot-testing/pull/23');
  process.exit(1);
}

if (!process.env.GITHUB_USER) {
  console.warn(
    'There was no GitHub user detected.',
    'This is fine, but mozBot won\'t work with private repos.'
  );
  console.warn(
    'To make mot work with private repos, please expose',
    'GITHUB_USER and GITHUB_PASSWORD as environment variables.',
    'The username and password must have access to the private repo',
    'you want to use.'
  );
}

var github = new GitHubApi({
  host: config.github.apiHost,
  pathPrefix: config.github.pathPrefix,
  protocol: config.github.protocol,
  port: config.github.port
});

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

var app = express();
//core function start
// read github api for nodejs
function buildMentionSentence(reviewers) {
  var atReviewers = reviewers.map(function(owner) { return '@' + owner; });

  if (reviewers.length === 1) {
    return atReviewers[0];
  }

  return (
    atReviewers.slice(0, atReviewers.length - 1).join(', ') +
    ' and ' + atReviewers[atReviewers.length - 1]
  );
}

function defaultMessageGenerator(reviewers, pullRequester) {
  return util.format(
    '%s, thanks for your PR! ' +
    'By analyzing the history of the files in this pull request' +
    ', we identified %s to be%s potential reviewer%s.',
    pullRequester,
    buildMentionSentence(reviewers),
    reviewers.length > 1 ? '' : ' a',
    reviewers.length > 1 ? 's' : ''
  );
}

function configMessageGenerator(message, reviewers, pullRequester) {
  var withReviewers = message.replace(/@reviewers/g, buildMentionSentence(reviewers));
  return withReviewers.replace(/@pullRequester/g, pullRequester);
}

function getRepoConfig(request) {
  return new Promise(function(resolve, reject) {
    github.repos.getContent(request, function(err, result) {
      if (err) {
        reject(err);
        return;
      }
      try {
        var data = JSON.parse(result.data);
        resolve(data);
      } catch (e) {
        try {
          e.repoConfig = result.data;
        } catch (e) {}
        reject(e);
      }
    });
  });
}

 async function work(body) {
  var data = {};
  try {
    data = JSON.parse(body.toString());
    console.log(data.pull_request.html_url);
  } catch (e) {
    console.error(e);
    function assignRequestCreater(data, reject){

      function getRequest(){
        github.pullRequests.get({
        owner: data.repository.owner.login,
        repo: data.repository.name,
        number: data.pull_request.number
      }, function(err,result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    }

    github.issues.addAssigneesToRequest({
      owner: data.repository.owner.login,
      repo: data.repository.name,
      number: data.pull_request.number,
      assignee: user
    }, function(err) {
      if (err) {
        if (typeof reject === 'function') {
          return reject(err);
        }
      }
    });
  }
  }
  };

app.post('/', function(req, res) {
  req.pipe(bl(function(err, body) {
    work(body)
      .then(function() { res.end(); })
      .catch(function(e) {
        console.error(e);
        console.error(e.stack);
        res.status(500).send('Internal Server Error');
      });
  }));
});

app.get('/', function(req, res) {
  res.send(
    'GitHub Mention Bot Active. ' +
    'Go to https://github.com/facebook/mention-bot for more information.'
  );
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function() {
  console.log('Listening on port', app.get('port'));
});
