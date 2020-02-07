window.addEventListener('DOMContentLoaded', function() {
    window.myNet = new Network();
    myNet.add_node('A', 200, 150);
    myNet.add_node('B', 140, 300);
    myNet.add_node('C', 300, 300);
    myNet.add_node('D', 300, 180);
    myNet.add_node('E', 450, 140);
    myNet.add_node('F', 410, 250);
    myNet.add_node('G', 280, 80);
    myNet.add_node('H', 360, 380);
    myNet.add_node('I', 480, 420);
    myNet.add_node('J', 210, 410);
    myNet.add_node('K', 530, 270);
    
    myNet.add_link(Link('A', 'B'), 6);
    myNet.add_link(Link('B', 'C'), 3);
    myNet.add_link(Link('B', 'J'), 5);
    myNet.add_link(Link('C', 'D'), 4);
    myNet.add_link(Link('C', 'J'), 7);
    myNet.add_link(Link('C', 'F'), 3);
    myNet.add_link(Link('J', 'H'), 2);
    myNet.add_link(Link('J', 'I'), 9);
    myNet.add_link(Link('F', 'H'), 7);
    myNet.add_link(Link('F', 'K'), 5);
    myNet.add_link(Link('C', 'H'), 4);
    myNet.add_link(Link('F', 'E'), 7);
    myNet.add_link(Link('E', 'K'), 3);
    myNet.add_link(Link('D', 'F'), 9);
    myNet.add_link(Link('D', 'G'), 2);
    myNet.add_link(Link('A', 'G'), 4);
    myNet.add_link(Link('G', 'E'), 3);
    myNet.add_link(Link('G', 'F'), 5);
    myNet.add_link(Link('H', 'K'), 3);
    myNet.add_link(Link('K', 'I'), 4);
    myNet.updateVis();

    document.getElementById('routeButton').addEventListener('click', function() {
        let button = this;

        if (button.hasAttribute('disabled')) {
            return;
        } else {
            button.innerText = 'Running...';
            button.setAttribute('disabled', 'disabled');
        }

        let source = document.getElementById('route1').value.trim();
        let target = document.getElementById('route2').value.trim();

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        setTimeout(async function() {
            let current = source, next, pathNotFound = false;

            document.querySelector('circle[data-id="'+source+'"]').classList.add('red');

            while (current != target) {
                let path = myNet.shortest_path(current, target);
                if (!path) {
                    pathNotFound = true;
                    break;
                }

                await sleep(1000);
                next = path[1];

                document.querySelector('circle[data-id="'+next+'"]').classList.add('red');

                let link1 = document.querySelector('line[data-link="'+current+'-'+next+'"]');
                let link2 = document.querySelector('line[data-link="'+current+'-'+next+'"]');
                if (link1) link1.classList.add('red');
                if (link2) link2.classList.add('red');

                current = next;
            }

            if (pathNotFound) {
                alert('Path not found.')
            } else {
                await sleep(1000);
            }

            document.querySelectorAll('.red').forEach(el => el.classList.remove('red'));
            button.innerText = 'Run';
            button.removeAttribute('disabled');
        }, 0);
    });
});