export async function getActions(owner, repo, workflows) {
    /*returns a list of actions that equals a workflow name defined in list 'workflow' */
    let res = await fetch (`https://api.github.com/repos/${owner}/${repo}/actions/runs`);
    let page1 = await res.json();
    let actions = [];
    console.log(page1.workflow_runs);
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