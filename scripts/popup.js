async function getActions(owner, repo, workflows) {
  /*returns a list of actions that equals a workflow name defined in list 'workflow' */
  let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs`);
  let page1 = await res.json();
  let actions = [];
  for (let run of page1.workflow_runs) {
      if (workflows.includes(run.name)){
          actions.push(run);
      }
  }

  if (page1.total_count > page1.workflow_runs.length){
      for (let page=2; page<=Math.ceil(page1.total_count/page1.workflow_runs.length); page++){
          let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs?page=${page}`);
          let record = await res.json();
          for (const run of record.workflow_runs) {
              if (workflows.includes(run.name)){
                  actions.push(run);
              }
          }
      }
  }

  return actions;
}

async function getDeploymentFrequency(owner, repo, deploymentWorkflow, releaseWorkflow, 
  timeUnit, startDate=null, endDate=null){
  /* 
  @param {array} deploymentWorkflow - Workflow names that represent a deployment
  @param {array} releaseWorkflow - Workflow names that represent a release
  @param {string} timeUnit - week, month, year or custom
  @param {date} startDate - if timeUnit == custom, need to include the start date of the current development cycle
  @param {date} endDate - if timeUnit == custom, need to include the end date of the current development cycle
  @returns {array} each action is a list, format [workflow name, time representation on the x axis]
  week - current week == 0, last week == 1, ...
  month - January == 1, Feburary == 2, ...
  year - The actual year of the action
  custom - current cycle == 0, last cycle == 1, ...
  */
  let actions = await getActions(owner, repo, deploymentWorkflow.concat(releaseWorkflow));

  let today = new Date();
  let filteredActions = [];
  switch (timeUnit){
      case 'week':
          for (let run of actions){
              let runDate = new Date(run.run_started_at);
              let weekNum = Math.floor(((today-runDate)/(1000*60*60*24)) / 7);
              if (weekNum < 12){
                  filteredActions.push([run.name, 11 - weekNum]);
              }
          }
          break;
      case 'month':
          for (let run of actions){
              let runDate = new Date(run.run_started_at);
              let monthDiff = ((today.getFullYear() - runDate.getFullYear())*12 + 
                  today.getMonth() - runDate.getMonth());
              if (monthDiff < 12){
                  filteredActions.push([run.name, runDate.getMonth()+1]);
              }
          }
          break;
      case 'year':
          for (let run of actions){
              let runDate = new Date(run.run_started_at);
              let yearDiff = (today.getFullYear() - runDate.getFullYear());
              if (yearDiff < 12){
                  filteredActions.push([run.name, runDate.getFullYear()]);
              }
          }
          break;
      case 'custom':
          const developCycle = Math.floor((endDate - startDate) / (1000*60*60*24));
          for (let run of actions){
              let runDate = new Date(run.run_started_at);
              let cycleNum = Math.floor(((startDate - runDate)/(1000*60*60*24)) / developCycle) + 1;
              if (cycleNum < 12){
                  filteredActions.push([run.name, cycleNum]);
              }
          }
          break;
  }
  return filteredActions;
}

async function getIssues(owner, repo){
  /*https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues*/
  let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/issues`);
  let record = await res.json();
  let issues = [];
  for (let issue of record) {
      if (!('pull_request' in issue)){
          issues.push(issue);
      }
  }

  let page = 2
  while (record.length === 30){
      let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/issues?page=${page}`);
      record = await res.json();
      for (let issue of record) {
          if (!('pull_request' in issue)){
              issues.push(issue);
          }
      }
      page += 1;
  
  }

  return issues;
}

async function getDefectDensity(owner, repo, deploymentWorkflow){
  /*
  @param {array} deploymentWorkflow - Workflow names that represent a deployment
  @returns {array} [metric1, metric2]
  metric1 = number of issues / number of deployments
  metric2 = number of issues / number of sucessful deployments
  metric3 = number of sucessful deployments / number of deployments
  */ 
  let issues = await getIssues(owner, repo);
  let actions = await getActions(owner, repo, deploymentWorkflow);
  let successDeploy = 0;
  for (let run of actions){
      if (run.conclusion === "success"){
          successDeploy += 1;
      }
  }
  let metric1 = issues.length / actions.length;
  let metric2 = issues.length / successDeploy;
  let metric3 = successDeploy / actions.length
  return [metric1, metric2, metric3];
}







google.charts.load('current', {'packages':['bar', 'line']});

const owner = 'appditto'
const repo = 'natrium_wallet_flutter'
document.getElementById("owner").innerHTML = owner;
document.getElementById("repo").innerHTML = repo;

getDeploymentFrequency(owner, repo, ['CI'], ['DEPLOY_RELEASE'], 'custom', new Date('2022-08-01T14:27:38Z'), new Date('2022-10-01T14:27:38Z'))
  .then(filteredActions => {
      // console.log(filteredActions)
      document.getElementById("filteredActions").innerHTML = filteredActions;
      
      const counts = {};
      const names = [];
      const variables = [];
      filteredActions.forEach(function (x) { 
          counts[x] = (counts[x] || 0) + 1;
          variables.push(x[0]+','+x[1].toString())
          names.push(x[0]);
      });
      const set1 = new Set(variables);
      const set2 = new Set(names);
      const variableList = Array.from(set1);
      const nameList = Array.from(set2);
      let valueList = [];
      for(let variable of variableList){
          valueList.push(counts[variable]);
      }
      var data = new google.visualization.DataTable();
      data.addColumn('number', 'month');
      for(let name of nameList){
        data.addColumn('number', name);
        // console.log(name)  
      }
      
      let rowsToAdd = [];
      for(let i = 0; i < 12; i++){
        let rowToAdd = [];
        rowToAdd.push(i+1);
        for(let name of nameList){
          rowToAdd.push(counts[[name, i]] || 0);
        }
        rowsToAdd.push(rowToAdd);
      }

      // console.log(rowsToAdd) 
      data.addRows(rowsToAdd);
    
      var options = {
        chart: {
          title: 'Deployment Frequency',
          subtitle: '',
        },
        width: 400,
        height: 250,
        legend: {position: 'none'} 
      };
    
      var chart = new google.charts.Line(document.getElementById('myChart1'));
    
      chart.draw(data, google.charts.Line.convertOptions(options));
      
  });
getDefectDensity(owner, repo, ['CI'])
  .then(metrics => {
      // console.log(metrics)
      document.getElementById("metrics").innerHTML = metrics;

      let dataSource = [['metric #','defect density']]
      let index = 1;
      for (let input of metrics){
        dataSource.push(['metric'+index.toString(), input.toString()]);
        index++;
      }
      console.log(dataSource)
      var data = google.visualization.arrayToDataTable(dataSource);

      var options = {
        title: 'Defect Density',
        bars: 'vertical',
        legend: {position: 'none'} 
      };

      var chart = new google.charts.Bar(document.getElementById('myChart2'));

      chart.draw(data, google.charts.Bar.convertOptions(options));
  });
