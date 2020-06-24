import * as React from 'react';
import Tooltip from './Tooltip';
import MoreButton from './MoreButton';

function colorByHashCode(value) {
    let hash = 0;
    if (value.length === 0) return hash;
    for (let i = 0; i < value.length; i += 1) {
        hash = value.charCodeAt(i) * 30 + hash;
    }
    const shortened = Math.abs(hash % 360);
    return `${shortened},100%,85%`;
}

const TokenButton = ({type, name, path, token, disabled, editMode, selectionValues, setPluginValue, showForm}) => {
    let style;
    let showValue = true;
    let properties = [type];
    const buttonClass = [];
    const active = selectionValues[type] === [path, name].join('.');
    if (editMode) {
        buttonClass.push('button-edit');
    }
    if (active) {
        buttonClass.push('button-active');
    }
    const onClick = (givenProperties, isActive = active) => {
        const propsToSet = givenProperties;
        if (editMode) {
            showForm({name, token, path});
        } else {
            const tokenValue = [path, name].join('.');
            let value = isActive ? 'delete' : tokenValue;
            if (propsToSet[0].clear && !active) {
                value = 'delete';
                propsToSet[0].forcedValue = tokenValue;
            }
            const newProps = givenProperties
                .map((i) => [[i.name || i], i.forcedValue || value])
                .reduce((acc, [key, val]) => ({...acc, [key]: val}), {});
            setPluginValue(newProps);
        }
    };
    style = {
        '--bgColor': colorByHashCode(name.toString()),
        backgroundColor: 'hsl(var(--bgColor))',
        border: 'none',
    };
    switch (type) {
        case 'borderRadius':
            style = {...style, borderRadius: `${token}px`};
            properties = [
                {
                    label: 'All',
                    name: 'borderRadius',
                    clear: [
                        'borderRadiusTopLeft',
                        'borderRadiusTopRight',
                        'borderRadiusBottomRight',
                        'borderRadiusBottomLeft',
                    ],
                },
                {label: 'Top Left', name: 'borderRadiusTopLeft'},
                {label: 'Top Right', name: 'borderRadiusTopRight'},
                {label: 'Bottom Right', name: 'borderRadiusBottomRight'},
                {label: 'Bottom Left', name: 'borderRadiusBottomLeft'},
            ];
            break;
        case 'opacity':
            style = {
                ...style,
                backgroundColor: `rgba(0,0,0, ${Number(token.slice(0, token.length - 1)) / 100})`,
            };
            break;
        case 'spacing':
            properties = [
                {label: 'All', name: 'spacing', clear: ['horizontalPadding', 'verticalPadding', 'itemSpacing']},
                {label: 'Horizontal', name: 'horizontalPadding'},
                {label: 'Vertical', name: 'verticalPadding'},
                {label: 'Gap', name: 'itemSpacing'},
            ];
            break;
        case 'fill':
            style = {
                width: '24px',
                height: '24px',
                borderRadius: '100%',
                backgroundColor: token,
                borderColor: '#ccc',
            };
            if (active) {
                buttonClass.push('button-active-fill');
            }
            showValue = false;
            break;
        default:
            break;
    }
    return (
        <Tooltip label={`${name}: ${token}`}>
            <div
                className={`relative flex button button-property ${buttonClass.join(' ')} ${
                    disabled && 'button-disabled'
                } `}
                style={style}
            >
                <button
                    className="w-full h-full"
                    disabled={editMode ? false : disabled}
                    type="button"
                    onClick={() => onClick(properties)}
                >
                    {showValue && <div className="button-text">{name}</div>}
                    {editMode && <div className="button-edit-overlay">Edit</div>}
                </button>
                {!editMode && properties.length > 1 && (
                    <MoreButton
                        disabled={disabled}
                        selectionValues={selectionValues}
                        properties={properties}
                        onClick={onClick}
                        value={name}
                        path={path}
                    />
                )}
            </div>
        </Tooltip>
    );
};

export default TokenButton;
