# &lt;juicy-tile-editor&gt;

`<juicy-tile-editor>` is a Polymer Element that adds an editor to control the setup of [`<juicy-tile-list>`](http://github.com/juicy-tile-list) and [`<juicy-tile-grid>`](http://github.com/juicy-tile-grid)

## Demos

[Check it live!](http://juicy.github.io/juicy-tile-editor)
> [`juicy-tile-grid` examples](http://juicy.github.io/juicy-tile-editor/examples/juicy-tile-grid/)

## Usage

1. Install the component using [Bower](http://bower.io/):

    ```sh
    $ bower install Juicy/juicy-tile-editor --save
    ```


2. Import Web Components' polyfill, if needed:

    ```html
    <script src="bower_components/webcomponentsjs/webcomponents.js"></script>
    ```

3. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/juicy-tile-table/juicy-tile-table.html">
    <link rel="import" href="bower_components/juicy-tile-editor/src/juicy-tile-editor.html">
    ```

4. Start using it!

    ```html
    <juicy-tile-editor selectionMode></juicy-tile-editor>
    <juicy-tile-table></juicy-tile-table>
    ```

## Options

Attribute                    | Options             | Default      | Description
---                          | ---                 | ---          | ---
`selectionMode`              | *Boolean*           |              | If present, the editor starts in selection mode

## Events

Event                     | Description
---                       | ---
`juicy-tile-editor-save`  | Triggers when configuration of any `<juicy-tile-list>` is saved.
`juicy-tile-editor-revert`| Triggers when configuration of any `<juicy-tile-list>` is reverted.
`juicy-tile-editor-clear` | Triggers when configuration of any `<juicy-tile-list>` is cleared.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Development

In order to develop it locally we suggest to use [polyserve](https://npmjs.com/polyserve) tool to handle bower paths gently.

1. Install [bower](http://bower.io/) & [polyserve](https://npmjs.com/polyserve): `$ npm install -g bower polyserve`
2. Install local dependencies: `$ bower install`
3. Start development server `$ polyserve` and open `http://localhost:8080/components/juicy-element/`.

## License

[MIT License](http://opensource.org/licenses/MIT)
