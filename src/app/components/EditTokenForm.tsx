import * as React from 'react';
import {useTokenDispatch} from '../store/TokenContext';
import Input from './Input';
import Modal from './Modal';

const EditTokenForm = ({
    submitTokenValue,
    explainer = '',
    property,
    isPristine,
    initialValue,
    initialName,
    path,
    schema,
    optionsSchema,
}) => {
    const title = isPristine ? `New Token in ${path}` : `${path}.${initialName}`;

    const defaultValue = {
        value: initialValue.value ?? initialValue,
        options: {
            description: initialValue.description,
        },
        name: initialName,
        path,
    };
    const [tokenValue, setTokenValue] = React.useState(defaultValue);
    const {setShowEditForm} = useTokenDispatch();

    const handleChange = (e) => {
        e.persist();
        setTokenValue((prevState) => ({...prevState, [e.target.name]: e.target.value}));
    };

    const handleObjectChange = (e) => {
        e.persist();
        setTokenValue((prevState) => ({...prevState, value: {...prevState.value, [e.target.name]: e.target.value}}));
    };

    const handleOptionsChange = (e) => {
        e.persist();
        setTokenValue((prevState) => ({
            ...prevState,
            options: {...prevState.options, [e.target.name]: e.target.value},
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submitTokenValue(tokenValue);
        setShowEditForm(false);
    };

    const handleReset = () => {
        setShowEditForm(false);
    };

    return (
        <Modal isOpen close={handleReset} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-start">
                <Input
                    required
                    full
                    label="Name"
                    value={tokenValue.name}
                    onChange={handleChange}
                    type="text"
                    name="name"
                />
                {typeof schema === 'object' ? (
                    Object.entries(schema).map(([key, schemaValue]: [string, string]) => (
                        <Input
                            key={key}
                            full
                            label={key}
                            value={tokenValue.value ? tokenValue.value[key] : tokenValue[key]}
                            onChange={handleObjectChange}
                            type="text"
                            name={key}
                            custom={schemaValue}
                            required
                        />
                    ))
                ) : (
                    <Input
                        full
                        label={property}
                        value={tokenValue.value}
                        onChange={handleChange}
                        type="text"
                        name="value"
                        required
                        custom={schema}
                    />
                )}

                {optionsSchema
                    ? Object.entries(optionsSchema).map(([key, schemaValue]: [string, string]) => (
                          <Input
                              key={key}
                              full
                              label={key}
                              value={tokenValue.options[key]}
                              onChange={handleOptionsChange}
                              type="text"
                              name={key}
                              custom={schemaValue}
                          />
                      ))
                    : null}

                {explainer && <div className="mt-1 text-xxs text-gray-600">{explainer}</div>}
                <div className="flex space-x-2 justify-end">
                    <button className="button button-link" type="button" onClick={handleReset}>
                        Cancel
                    </button>
                    <button className="button button-primary" type="submit">
                        {isPristine ? 'Create' : 'Update'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditTokenForm;
