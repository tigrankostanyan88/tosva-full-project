// moduls
const crypto = require('crypto')
const sharp = require('sharp')
const fs = require('fs')

module.exports = class File {
    // Constructor function that creates an instance of a class with model, file and options parameters
    constructor(model, file, options = {}) {
        // Creating an empty object to store data related to the model, file and options passed in as input
        this.data = {};
        this.data.model = model;
        this.data.file = file;
        this.data.options = options;

        // Setting initial values for status and message properties
        this.status = 'error';
        this.message = {};

        // Calling the _setTableData method to set initial table data
        this._setTableData();
    }
    // user, req.files.image,

    /* Main methods */
    async add(name_used) {
        this.table.name_used = name_used;

        // 1) Check allowed - media[size, type], names
        const allowed = await this._checkAllowed();

        if (allowed.status == 'error') {
            this.message = allowed.messages;
            return this._result();
        }

        // 2) Check media image
        if (allowed.media.name == 'image') {
            // 1) Check Watermark
            this.data.file.watermark = allowed.limits.watermark || false;

            // 2) Check dimensions for resizing
            // resize and save
            if (allowed.limits.dimensions) {
                // image width & height
                const { width, height } = this.data.file.metadata;
                // allowed dimensions
                const dimensions = allowed.limits.dimensions;

                // large
                if (dimensions.large) {
                    const resizeSaveLarge = await this._saveImage(width, height, dimensions, 'large');
                    if (!resizeSaveLarge) return this._result();
                }
                // small
                if (dimensions.small) {
                    const resizeSaveSmall = await this._saveImage(width, height, dimensions, 'small');
                    if (!resizeSaveSmall) return this._result();
                }
            }
            // no resize, save only
            else {
                const saveImage = await this._saveImage();
                if (!saveImage) return this._result();
            }
        }
        // audio, video, application (pdf, zip)
        else {
            // save file
            const saveFile = await this._saveFile();
            if (!saveFile) return this._result();
        }

        this.status = 'success';
        return this._result();
    }

    async replace(name_used) {
        // 1) Check files
        if (!this.data.model.files) {
            this.message.files = `In "${this.table.table_name}" model "files" are not included.`;
            return this._result();
        }
        // 1) Remove old file
        const oldFile = this.data.model.files.find(f => f.name_used == name_used);
        if (oldFile) {
            // DB
            await oldFile.destroy();
            // Model.files[]
            const index = this.data.model.files.indexOf(oldFile);
            this.data.model.files.splice(index, 1);
        }
        // 2) Add new file
        return await this.add(name_used);
    }

    /* Inner methods */
    // set only table data
    _setTableData() {
        // Creating an empty object to store table related data
        this.table = {};
        // 1) Setting the required properties for the table
        // 1.2) Extracting the model name from the model constructor and assigning it to the table_name property
        this.table.table_name = this.data.model.constructor.name;
        // 2). Setting the row_id for the table equal to the id of the model passed in as input
        this.table.row_id = this.data.model.id;
        // 3). Setting the original file name of the data as name_original and hashed file name as name using crypto library
        this.table.name_original = this.data.file.name,
        this.table.name = crypto.createHash('sha1').update(`${this.table.name_original}-${Date.now()}`).digest('hex');
        this.table.type = this.data.file.mimetype;

        // optional
        this.table.col_name = this.data.options.col_name || null;
        this.table.title = this.data.options.title || null;

        // procedural for images

        /* this.table.name_used = name; - add(), replace() */
    }

    // names, size, media, type (for files)
    async _checkAllowed() {
        // create an empty 'allowed' object
        const allowed = {};

        // extract the media type from the file mimetype / (image)
        const media = this.data.file.mimetype.split('/')[0];

        console.log(media);

        // for(key of this.data.file) {
        //     var media = key.mimetype.split('/')[0];
        // }

       
        // extract the file type (extension) from the table type / (jpg)
        const type = this.table.type.split('/')[1];

        // get the file size in bytes
        const size = this.data.file.size;

   
        // count the number of files with the same name_used field as the current file in the data model
        const count = this.data.model.files.filter(f => f.name_used == this.table.name_used).length;

    
        /* get the allowed limits for the current table
        and name in the form of an object and assign it to the 'limits' property of the 'allowed' object */
        allowed.limits = this._getAllowedLimits(this.table.table_name, this.table.name_used);
        // get the allowed media types for the current file's media type and assign it to the 'media' property of the 'allowed' object
        allowed.media = this._getAllowedMedia(media);
        // set the initial status of the 'allowed' object to 'error'
        allowed.status = 'error';
        // create an empty 'messages' object to store any error messages related to the file upload
        allowed.messages = {};

        // Check if allowed media exists
        console.log('Allowed media: ', allowed.media ? true : false);
        // Check if limits status is successful and names are allowed
        console.log('Allowed names:', allowed.limits.status == 'success' ? true : false);

        // 1.1) Check media
        if (!allowed.media) {
            allowed.messages.media = `"The "${this.data.file.mimetype} media type is not allowed.`;
        } else {
            console.log('Allowed size: ', allowed.media.size >= size ? true : false);

            // 1.2) Check size
            if (allowed.media.size < size) {
                allowed.messages.size = `The size (${size} bytes) is too large, limit is ${allowed.media.size} bytes.`;
            }
        }

        // 1.3) Check names
        if (allowed.limits.status != 'success') {
            // table_name / Check for errors in limits
            // 2.1) Check if table exists
            if (allowed.limits.reason == 'table') {
                allowed.messages.table = `Table "${this.table.table_name}" not found.`;
            }
             
            // 2.2) Check if name_used exists for the specified table
            if (allowed.limits.reason == 'name') {
                allowed.messages.name = `Name "${this.table.name_used}" for table "${this.table.table_name}" not found.`;
            }
        } else {
            console.log('Allowed count:', allowed.limits.count > count ? true : false);

            // 1.4) Check count
            if (allowed.limits.count <= count) {
                allowed.messages.count = `Count limit for "${this.table.name_used}" in "${this.table.table_name}" table is "${allowed.limits.count}" ${allowed.limits.count > 1 ? 'files' : 'file'}.`;
            }
            // 1.5) Check type
            // file
            if (media != 'image') {
                console.log('Allowed type (file): ', allowed.limits.types.includes(type) ? true : false);

                // Check if file type is allowed
                if (!allowed.limits.types.includes(type)) {
                    allowed.messages.type = `The type "${type}" is not allowed. Allowed types are "${allowed.limits.types.toString()}".`;
                }
            }
            // image
            else {
                // image metadata (format, width, height)
                await this._setMetadata();
                this.table.ext = this.data.file.metadata.format;
                this.table.sizes = {};

                console.log('Allowed type (image): ', allowed.limits.types.includes(this.table.ext) ? true : false);

                // check format
                if (!allowed.limits.types.includes(this.table.ext)) {
                    allowed.messages.format =
                        `For "${this.table.name_used}
                        " is not allowed "
                        ${this.table.ext}" format. Allowed only "
                        ${allowed.limits.types.join(', ')}
                        " ${allowed.limits.types.length > 1 ? 'formats' : 'format'}.`;
                }
            }
        }

        // no errors
        if (!Object.keys(allowed.messages).length) {
            allowed.status = 'success';
            delete allowed.messages;
        }

        return allowed;
    }
    // name, count, types, dimensions (for images)
    _getAllowedLimits(table, name) {
        // table - used names
        // ? - save to database
        const names = [
            {
                table: 'users',
                files: [
                    {
                        name: 'avatar',
                        count: 1,
                        types: ['jpeg', 'png', 'webp'],
                        dimensions: { small: [160, 160], large: [600, 600] },
                        // watermark: true
                    },
                    {
                        name: 'cover',
                        count: 1,
                        types: ['jpeg', 'png', 'webp'],
                        dimensions: { large: [1920, 400] }
                    },
                ]
            },
            {
                table: 'products',
                files: [
                    {
                        name: 'image',
                        count: 1,
                        types: ['jpeg', 'png', 'gif', 'webp', 'svg'],
                        dimensions: { large: [400] }
                    },
                    {
                        name: 'gallery',
                        count: 10,
                        types: ['jpeg', 'png', 'webp'],
                        dimensions: { small: [60, 60], large: [600, 600] }
                    },
                ]
            }
        ];

        // check table name
        let tableData = names.find(n => n.table == table);
        if (!tableData) {
            return {
                status: 'error',
                reason: 'table'
            }
        }
        // check used name
        let nameData = tableData.files.find(n => n.name == name);
        if (!nameData) {
            return {
                status: 'error',
                reason: 'name'
            }
        }

        // success
        nameData.status = 'success';
        return nameData;
    }
    // media, types (for files), limit (size in bytes)
    _getAllowedMedia(media) {
        // ? - save to database
        const mediaTypes = [
            { name: 'image', types: ['jpeg', 'png', 'gif', 'webp', 'svg'], size: 50 * 1024 * 1024 }
        ];

        return mediaTypes.find(m => m.name === media);
    }

    // for images only
    async _setMetadata() {
        const { format, width, height } = await sharp(this.data.file.data).metadata();
        this.data.file.metadata = { format, width, height }
    }

    // save
    async _saveImage(width, height, dimensions, size) {
        // 1) image sharp
        const image = sharp(this.data.file.data);

        // 2) Pathes
        let pathSize = size ? `/${size}` : '',
            pathStart = `./public/img/${this.table.table_name}${pathSize}`,
            pathFile = `${this.table.name}.${this.table.ext}`;

        // gallery
        if (this.table.name_used == 'gallery')
            pathStart = `./public/img/${this.table.table_name}/gallery${pathSize}`;

        // summernote
        if (this.table.name_used == 'summernote')
            pathStart = `./public/files/summernote`;

        // check path
        if (!fs.existsSync(`${pathStart}`))
            fs.mkdirSync(`${pathStart}`, { recursive: true });

        // 4) Save
        // resize
        if (width && height && dimensions) {
            // check image dimensions
            if (width < dimensions[size][0]) {
                this.message.width = `Image width is ${width}, but must be >= ${dimensions[size][0]} (${size}: ${dimensions[size].join('x')}).`;
                return false;
            }
            if (height < dimensions[size][1]) {
                this.message.height = `Image height is ${height}, but must be >= ${dimensions[size][1]} (${size}: ${dimensions[size].join('x')}).`;
                return false;
            }

            // resize
            image.resize(...dimensions[size]);

            // watermark
            if (this.data.file.watermark) this._addWatermark(image);

            // format
            image.toFormat(this.table.ext);

            // save
            try {
                const imageNew = await image.toFile(`${pathStart}/${pathFile}`);
                // real sizes after save
                this.table.sizes[size] = {
                    size: imageNew.size,
                    width: imageNew.width,
                    height: imageNew.height
                }
            } catch (err) {
                this.message.file = `Image not saved...`;
                this.message.err = err;
                return false;
            }
        }
        // no resize
        else {
            // watermark
            if (this.data.file.watermark) this._addWatermark(image);

            // format
            image.toFormat(this.table.ext);

            // save
            try {
                const imageNew = await image.toFile(`${pathStart}/${pathFile}`);
                // real sizes after save
                this.table.sizes = {
                    size: imageNew.size,
                    width: imageNew.width,
                    height: imageNew.height
                }
            } catch (err) {
                this.message.file = 'Image not saved...';
                this.message.err = err;
                return false;
            }
        }

        return true;
    }

    async _saveFile() {
        // 2) Pathes
        let pathStart = `./public/files`,
            pathFile = `${this.table.name}.${this.table.ext}`;

        // summernote
        if (this.table.name_used == 'summernote')
            pathStart = `./public/files/summernote`;

        // check path
        if (!fs.existsSync(`${pathStart}`))
            fs.mkdirSync(`${pathStart}`, { recursive: true });

        // 2) Save
        try {
            await this.data.file.mv(`${pathStart}/${pathFile}`);
        } catch (err) {
            this.message.file = 'File not saveed...';
            this.message.err = err;
            return false;
        }

        return true;
    }

    // add watermark
    _addWatermark(image) {
        if (image.options.width >= 600 && image.options.height >= 600) {
            // watermark_xl.png (161x161)
            let pathWatermrk = './public/watterMark/logo.svg',
                offsetX = image.options.width - 161 - 15,
                offsetY = image.options.height - 161 - 15;
            // add watermark
            image.composite([ { input: pathWatermrk, left: offsetX, top: offsetY } ]);
        }
    }

    // return result
    _result() {
        delete this.data;
        this.status == 'error' ? delete this.table : delete this.message;
        return this;
    }
};
