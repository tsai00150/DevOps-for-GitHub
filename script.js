function getOwnerAndRepo(){
    url = window.location.href;
    urlElements = url.split('/');
    const owner = urlElements[3]
    const repo = urlElements[4]
    return [owner, repo]
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

    return actions
}

async function getDeploymentFrequency(owner, repo, deploymentWorkflow, releaseWorkflow){
    promise = getActions(owner, repo, deploymentWorkflow.concat(releaseWorkflow));
    promise.then((actions) => {
        //TODO
  });
}


const [owner, repo] = getOwnerAndRepo();



