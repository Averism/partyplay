export default {
    domain: require('child_process').execSync('ifconfig | grep inet\\ 192').toString().trim().split(' ')[1],
    port: 3000,
    assetFolder: 'workspace'
}