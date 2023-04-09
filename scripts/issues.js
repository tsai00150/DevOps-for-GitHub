import { getActions } from './action.js';
export async function getIssues(owner, repo){
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

export async function getDefectDensity(owner, repo, deploymentWorkflow){
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