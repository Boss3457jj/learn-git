
document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("theme-toggle");
    const body = document.body;
    

    if (localStorage.getItem("theme") === "light") {
        body.classList.add("light-mode");
    }

    
    toggleBtn.addEventListener("click", function () {
        body.classList.toggle("light-mode");

       
        if (body.classList.contains("light-mode")) {
            localStorage.setItem("theme", "light");
        } else {
            localStorage.setItem("theme", "dark");
        }
    });

   
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    document.body.style.overflowX = "hidden"; 
});