function getOwnerAndRepo(){
    url = window.location.href;
    urlElements = url.split('/');
    const owner = urlElements[3];
    const repo = urlElements[4];
    return [owner, repo];
}

async function getActions(owner, repo, workflows) {
    /*returns a list of actions that equals a workflow name defined in list 'workflow' */
    let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs`);
    let page1 = await res.json();
    actions = [];
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
    timeUnit, developCycle=null){
    actions = await getActions(owner, repo, deploymentWorkflow.concat(releaseWorkflow))

    today = new Date();
    filteredActions = [];
    switch (timeUnit){
        case 'week':
            for (let run of actions){
                runDate = new Date(run.run_started_at);
                weekNum = Math.floor(((today-runDate)/(1000*60*60*24)) / 7);
                if (weekNum < 12){
                    filteredActions.push([run.name, 11 - weekNum]);
                }
            }
            break;
        case 'month':
            let count = 0;
            for (let run of actions){
                count += 1;
                runDate = new Date(run.run_started_at);
                monthDiff = ((today.getFullYear() - runDate.getFullYear())*12 + 
                    today.getMonth() - runDate.getMonth());
                if (monthDiff < 12){
                    filteredActions.push([run.name, runDate.getMonth()]);
                }
            }
            break;
        case 'year':
            for (let run of actions){
                runDate = new Date(run.run_started_at);
                yearDiff = (today.getFullYear() - runDate.getFullYear());
                if (yearDiff < 12){
                    filteredActions.push([run.name, runDate.getFullYear()]);
                }
            }
            break;
        case 'custom':
            for (let run of actions){
                runDate = new Date(run.run_started_at);
                cycleNum = Math.floor(((today-runDate)/(1000*60*60*24)) / developCycle);
                if (cycleNum < 12){
                    filteredActions.push([run.name, 11 - cycleNum]);
                }
            }
            break;
    }
    return filteredActions;
}


const [owner, repo] = getOwnerAndRepo();
getDeploymentFrequency(owner, repo, ['CI'], ['DEPLOY_RELEASE'], 'custom', 150)
    .then(filteredActions => {
        console.log(filteredActions)
    });
