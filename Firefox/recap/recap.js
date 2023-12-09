const MoodleAPI = {
    fetchJson: async (url, body) => {
        return await fetch(url, {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            "body": JSON.stringify(body),
            "method": "POST",
        });
    },
    getSessKey: () => {
        return wrappedJSObject.M.cfg.sesskey;
    },
    getCourses: async () => {
        let resp = await MoodleAPI.fetchJson(
            `https://moodle.uclouvain.be/lib/ajax/service.php?sesskey=${MoodleAPI.getSessKey()}&info=core_course_get_enrolled_courses_by_timeline_classification`,
            [{
                index: 0,
                methodname: "core_course_get_enrolled_courses_by_timeline_classification",
                args: {
                    offset: 0,
                    limit: 100,
                    classification: "all"
                }
            }]);
        return (await resp.json())[0].data.courses
    }
}

console.log("Recap hooked :D")

async function showCourses() {
    let courses = await MoodleAPI.getCourses();
    let template = document.getElementById("courseRow");
    for (let course of courses) {
        let elem = template.content.cloneNode(true);
        let a = elem.querySelectorAll("a")[0]
        a.innerText = course.fullname;
        a.href = "/course/view.php?id="+course.id;
        template.parentNode.appendChild(elem);
    }
}


showCourses()