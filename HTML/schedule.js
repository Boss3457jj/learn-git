
let html = '';
fixtures.forEach(match => {
    html += `
        <tr>
            <td>${match.date}</td>
            <td>${match.home}</td>
            <td>${match.away}</td>
            <td>${match.venue}</td>
        </tr>
    `;
});

document.getElementById('fixtures').innerHTML = html;
