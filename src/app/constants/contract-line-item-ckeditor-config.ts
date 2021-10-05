export const LineItemCkEditorConfig = {
    startupFocus: false,
    readOnly: false,
    toolbar: [
        {
            name: 'basicstyles',
            items: ['Bold', 'Italic', 'Underline', 'Strike']
        },
        {
            name: 'paragraph',
            items: ['BulletedList', 'NumberedList']
        },
        { name: 'tools', items: ['Maximize'] }
    ],
    removeButtons: 'Subscript,Superscript',
    removePlugins: 'elementspath, magicline',
    resize_enabled: false,
    height: 150,
    width: 480
};
