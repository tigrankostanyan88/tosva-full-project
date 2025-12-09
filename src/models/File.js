const fs = require('fs')

module.exports = (con, DataTypes) => {
    const File = con.define('files', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        table_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Also folder name'
        },
        row_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Id of row in the table'
        },
        col_name: {
            type: DataTypes.STRING(50),
            comment: 'For summernote'
        },
        title: {
            type: DataTypes.STRING,
            comment: 'For gallery'
        },
        name_original: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Original file name'
        },
        name_used: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'For use'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Name in folder'
        },
        ext: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Extension'
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Mimetype'
        },
        sizes: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'size (in bytes), dimensions (for images)'
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: con.literal("CURRENT_TIMESTAMP"),
            allowNull: false,
            comment: 'Creation date'
        },
        sort: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            comment: 'For gallery'
        }
    }, {
        hooks: {
            beforeFind: async (query) => {},
            beforeDestroy: async (file, options) => {
                // 1) Pathes
                let pathStart = `./public/files`,
                    pathFile = `${file.name}.${file.ext}`;

                

                // 1) Check media type
                // image
                if (file.type.startsWith('image')) {
                    // 1) Check path
                    // procedural
                    pathStart = `./public/img/${file.table_name}`;
                    // gallery
                    if (file.name_used == 'gallery')
                    pathStart = `./public/img/${file.table_name}/gallery`;
                    // summernote
                    if (file.name_used == 'summernote')
                    pathStart = `./public/files/summernote`;

                    // 2) Remove
                    // no large & small
                    if (file.name_used == 'summernote' || (!file.sizes.large && !file.sizes.small)) {
                        file.removeFromPath(`${pathStart}/${pathFile}`);
                    } else {
                        // large
                        if (file.sizes.large)
                        file.removeFromPath(`${pathStart}/large/${pathFile}`);
                        // small
                        if (file.sizes.small)
                        file.removeFromPath(`${pathStart}/small/${pathFile}`);
                    }
                }
                // file
                else {
                    file.removeFromPath(`${pathStart}/${pathFile}`);
                }
            }
        }
    });
    File.prototype.removeFromPath = async path => {
        if (fs.existsSync(path)) fs.unlinkSync(path);
    }
    return File;
}
