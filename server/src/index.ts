// temporary code to test the build process, this is designed so the process does not exit unless a SIGTERM is passed
function main() {
    console.log('hello world!!');

    process.stdin.on('data', (d) => {
        //
        console.log(d.toString().trim());
    });
}

main();
