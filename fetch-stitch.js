const fs = require('fs');
fetch('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzJhODNjODgzMzI2MTQ4OGZiNDY2N2UyNzkyYzA1MzM2EgsSBxDN-Nyzig4YAZIBIwoKcHJvamVjdF9pZBIVQhM5MzI1MTk1NDMzNjIzNDM3MzQw&filename=&opi=96797242')
    .then(r => r.text())
    .then(t => fs.writeFileSync('.stitch-temp.html', t));
