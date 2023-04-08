import { getDeploymentFrequency } from './action.js';

const owner = 'appditto'
const repo = 'natrium_wallet_flutter'
getDeploymentFrequency(owner, repo, ['CI'], ['DEPLOY_RELEASE'], 'custom', new Date('2022-08-01T14:27:38Z'), new Date('2022-10-01T14:27:38Z'))
    .then(filteredActions => {
        console.log(filteredActions)
    });
