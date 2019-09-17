var root = document.body


var ImportTile = {
    view: function() {
        return m("main", [ 
            m("h1", {class: "title"}, "Import"),
            m("a", {href: "#!/MainMenu"}, "Import Tile")
        ])
    }
}

var MainMenu = {
    view: function() {
        return m("main", [ 
            m("h1", "MainMenu"),
            m("a", {href: "#!/ImportTile"}, "Return")
        ])
    }
}

m.route(root, "/ImportTile", {
    "/ImportTile": ImportTile,
    "/MainMenu": MainMenu,
})