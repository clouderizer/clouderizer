module.exports = {
    attributes: {
        project_name: {
            type: 'ref', columnType: 'string',
            required: true,
            unique: true,
        },
        status: {
            type: 'ref', columnType: 'string',
            required: true
        },
        project_description: {
            type: 'ref', columnType: 'string'
        },
        trained_time: {
            type: 'ref', columnType: 'string',
            required: true
        },
        models: {
            type: 'json'
        },
        input: {
            type: 'json'
        },
        output: {
            type: 'json'
        }
    },
};