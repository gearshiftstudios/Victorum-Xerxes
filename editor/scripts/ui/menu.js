const menus = {
    sub: {
        file: {
            element: null,
            buttons: [
                [ 'New' ],
                [ 'Open' ],
                [ 'Save' ],
                [ 'Save As' ],
                [ 'Import GLTF' ],
                [ 'Package' ],
            ],
        },
        edit: {
            element: null,
            buttons: [
                [ 'Undo' ],
                [ 'Redo' ],
            ],
        },
    },
}

function generateMenu () {
    const buttons = document.body.querySelector( '#menu' )
        .querySelector( '#buttons' ).querySelectorAll( 'button' )

    for ( let i = 0; i < buttons.length; i++ ) {
        buttons[ i ].isMenuButton = true

        if ( menus.sub[ buttons[ i ].innerHTML.toLowerCase() ] ) {
            const menu = document.createElement( 'container' )
            menu.id = `sub-menu.${ buttons[ i ].innerHTML.toLowerCase() }`
            menu.setAttribute( 'style', `
                position: absolute;
                left: 0;
                top: 34px;

                min-width: 125px;

                background-color: #313131;
                border-radius: 0 0 5px 5px;
                border: solid 1px #6c6c6c;
                border-top: none;
                box-shadow: 0 0 10px black, inset 0 0 10px black;
                display: none;
                padding: 5px 0 5px 0;
            ` )

            menus.sub[ buttons[ i ].innerHTML.toLowerCase() ].element = menu

            menus.sub[ buttons[ i ].innerHTML.toLowerCase() ].buttons.forEach( _i => {
                const item = document.createElement( 'button' )
                item.innerHTML = _i[ 0 ]
                item.setAttribute( 'sub-menu', '' )
    
                menu.appendChild( item )
            } )

            document.body.appendChild( menu )

            buttons[ i ].onclick = function () {
                for ( let b = 0; b < buttons.length; b++ ) {
                    if ( menus.sub[ buttons[ b ].innerHTML.toLowerCase() ] ) {
                        menus.sub[ buttons[ b ].innerHTML.toLowerCase() ].element.style.display = 'none'
                    }
                }

                const submenu = document.getElementById( `sub-menu.${ this.innerHTML.toLowerCase() }` )
                submenu.style.display = 'inline-block'
                submenu.style.left = `${ this.getBoundingClientRect().left }px`
            }
        }
    }
}

export { generateMenu }