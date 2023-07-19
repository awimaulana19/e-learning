var snow = new Quill('#snow', {
    theme: 'snow'
});
var bubble = new Quill('#bubble', {
    theme: 'bubble'
});

document.querySelector('form').onsubmit = function() {
    var text = bubble.root.innerHTML;
    document.querySelector('#deskripsi').value = text;

    var text2 = snow.root.innerHTML;
    document.querySelector('#aturan').value = text2;
}

new Quill("#full", { 
    bounds: "#full-container .editor", 
    modules: { 
        toolbar: [
            [{ font: [] }, { size: [] }], 
            ["bold", "italic", "underline", "strike"], 
            [
                { color: [] }, 
                { background: [] }
            ], 
            [
                { script: "super" }, 
                { script: "sub" }
            ], 
            [
                { list: "ordered" }, 
                { list: "bullet" }, 
                { indent: "-1" }, 
                { indent: "+1" }
            ], 
            ["direction", { align: [] }], 
            ["link", "image", "video"], 
            ["clean"]] 
        }, 
        theme: "snow" 
    })