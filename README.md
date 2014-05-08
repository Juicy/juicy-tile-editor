# &lt;pj-sortable-tiles-editor&gt;

`<pj-sortable-tiles-editor>` is a Polymer Element that adds an editor to control the setup of `<pj-sortable-tiles>`

## Demo

[Check it live!](http://polyjuice.github.io/pj-sortable-tiles-editor)

## Usage

1. Install the component using [Bower](http://bower.io/):

    ```sh
    $ bower install pj-sortable-tiles-editor --save
    ```

2. Import Web Components' polyfill:

    ```html
    <script src="http://cdnjs.cloudflare.com/ajax/libs/polymer/0.2.2/platform.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/polymer/0.2.2/polymer.js"></script>
    ```

3. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/pj-sortable-tiles/src/pj-sortable-tiles.html">
    <link rel="import" href="bower_components/pj-sortable-tiles-editor/src/pj-sortable-tiles-editor.html">
    ```

4. Start using it!

    ```html
    <pj-sortable-tiles-editor selectionMode></pj-sortable-tiles-editor>
    <pj-sortable-tiles></pj-sortable-tiles>
    ```

## Options

Attribute                    | Options             | Default      | Description
---                          | ---                 | ---          | ---
`selectionMode`              | *Boolean*           |              | If present, the editor starts in selection mode

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

[MIT License](http://opensource.org/licenses/MIT)