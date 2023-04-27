export async function getActions(owner, repo, workflows) {
    /*returns a list of actions that equals a workflow name defined in list 'workflow' */

    let config = await fetch ('../config.json');
    config = await config.json();

    let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs`, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${config.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });
    let page1 = await res.json();
    let actions = [];
    for (let run of page1.workflow_runs) {
        if (workflows.includes(run.name)){
            actions.push(run);
        }
    }

    if (page1.total_count > page1.workflow_runs.length){
        for (let page=2; page<=Math.ceil(page1.total_count/page1.workflow_runs.length); page++){
            let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs?page=${page}`, {
                headers: {
                    "Accept": "application/vnd.github+json",
                    "Authorization": `Bearer ${config.token}`,
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });
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

export async function getDeploymentFrequency(owner, repo, deploymentWorkflow, releaseWorkflow, 
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
                    filteredActions.push([run.name, yearDiff]);
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

export async function getUnitTest(owner, repo, workflows, jobname, steporder, stepname) {
    /* 
    This function only works with Python's unittest library. 
    @param {array} workflows - the workflow name that we want to get unit test, ONLY ONE WORKFLOW IS ALLOWED
    @param {string} jobname - the job name that has the unit test, ex: 'build (3.9)'
    @param {int} steporder - the order of the step that has the unit test, ex: 4
    @param {string} stepname - the step name that has the unit test, ex: 'Test with unittest'
    @returns {array} each unit test is a list, format [passedTests, failedTests, errorTests, time]
    */

    let config = await fetch ('../config.json');
    config = await config.json();

    let actions = await getActions(owner, repo, workflows);
    let unitTests = [];

    for (let run of actions){
        let logs = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/logs`, {
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `Bearer ${config.token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        
        let zipfile = await fetch (logs.url);
        zipfile = zipfile.blob()
        
        let new_zip = new JSZip();
        new_zip.loadAsync(zipfile)
        .then(function(zip) {
            return zip.file(jobname+"/"+steporder.toString()+'_'+stepname+".txt").async("string");
        }).then(function (content) {

            let testCountStr = content.match("Ran [0-9]+ tests in [0-9.]+s")
            if (testCountStr !== null){
                // the run has a unit test
                let passedTests;
                let failedTests;
                let errorTests;

                let testCount = parseInt(testCountStr[0].split(' ')[1]);
                let testResult = content.match("(OK|FAILED.+)")[0];

                if (testResult.slice(0,2) === "OK"){
                    let testCount = parseInt(content.match("Ran [0-9]+ tests in [0-9.]+s")[0].split(' ')[1]);
                    passedTests = testCount;
                    failedTests = 0;
                    errorTests = 0;
                } else{
                    if (testResult.match("failures=\\d+") !== null){
                        failedTests = parseInt(testResult.match("failures=\\d+")[0].split('=')[1]);
                    } else {
                        failedTests = 0;
                    }
                    if (testResult.match("errors=\\d+") !== null){
                        errorTests = parseInt(testResult.match("errors=\\d+")[0].split('=')[1]);
                    } else {
                        errorTests = 0;
                    }
                    passedTests = testCount - failedTests - errorTests;
                }

                unitTests.push([passedTests, failedTests, errorTests, run.created_at]);
                console.log("Processed unit test run number: " + run.run_number)
            }

          });
    }
    return unitTests;
}

export async function drawUnitTest(owner, repo, workflows, jobname, steporder, stepname){
    getUnitTest(owner, repo, workflows, jobname, steporder, stepname)
          .then(result => {
            console.log(result);

            google.charts.load('current', {'packages':['bar']});

            google.charts.setOnLoadCallback(drawChart);

            function drawChart() {
                  
              let dataSource = [['Date', 'Failure / total' , 'Error / total', 'Failure+Error / total']]
              
              for (let input of result){
                const dateAndTime = input[3].split('T');
                const dateList = dateAndTime[0].split('-');
                const timeList = dateAndTime[1].split(':');
                const toShow = dateList[1]+'/'+dateList[2]+' '+timeList[0]+':'+timeList[1];

                const total = input[0]+input[1]+input[2];
                const FaE = input[1]+input[2];
                dataSource.push([toShow, input[1]/total, input[2]/total, FaE/total]);

              }

            //   console.log(dataSource)
              var data = google.visualization.arrayToDataTable(dataSource);

              var options = {
                chart: {
                  title: '',
                  subtitle: '',
                },
                bars: 'vertical',
                legend: {position: 'none'} 
              };

              var chart = new google.charts.Bar(document.getElementById('myChart21'));

              chart.draw(data, google.charts.Bar.convertOptions(options));
            }


          });


          // google.charts.load('current', {'packages':['bar']});
          
          // var rawData = [
          //         [4, 4, 2, '2023-03-01T18:42:43Z'],
          //         [4, 3, 3, '2023-03-01T18:40:37Z'],
          //         [4, 3, 2, '2023-03-01T18:37:58Z'],
          //         [4, 2, 3, '2023-03-01T18:36:14Z'],
          //         [2, 4, 3, '2023-03-01T18:35:27Z'],
          //         [2, 0, 0, '2023-03-01T18:26:51Z'],
          //         [8, 1, 0, '2023-02-28T18:30:17Z'],
          //         [4, 4, 1, '2023-02-28T18:26:20Z'],
          //         [6, 0, 1, '2023-02-27T17:38:13Z'],
          //         [6, 1, 0, '2023-02-27T17:30:58Z'],
          //         [2, 0, 0, '2023-02-27T17:24:02Z'],
          //         [2, 0, 0, '2023-02-26T18:34:55Z'],
          //         [1, 1, 0, '2023-02-26T18:32:36Z']
          //       ];

          // google.charts.setOnLoadCallback(drawChart);

          // function drawChart() {
                
          //   let dataSource = [['Date', 'Failure / total' , 'Error / total', 'Failure+Error / total']]
            
          //   for (let input of rawData){
          //     const dateAndTime = input[3].split('T');
          //     const dateList = dateAndTime[0].split('-');
          //     const timeList = dateAndTime[1].split(':');
          //     const toShow = dateList[1]+'/'+dateList[2]+' '+timeList[0]+':'+timeList[1];

          //     const total = input[0]+input[1]+input[2];
          //     const FaE = input[1]+input[2];
          //     dataSource.push([toShow, input[1]/total, input[2]/total, FaE/total]);

          //   }

          //   console.log(dataSource)
          //   var data = google.visualization.arrayToDataTable(dataSource);

          //   var options = {
          //     chart: {
          //       title: 'Advanced Defect Density(Test Cases)',
          //       subtitle: '',
          //     },
          //     bars: 'vertical',
          //     legend: {position: 'none'} 
          //   };

          //   var chart = new google.charts.Bar(document.getElementById('myChart21'));

          //   chart.draw(data, google.charts.Bar.convertOptions(options));
          // }

}