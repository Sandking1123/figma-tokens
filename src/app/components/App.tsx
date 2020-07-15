import * as React from 'react';
import '../styles/main.css';
import objectPath from 'object-path';
import JSON5 from 'json5';
import JSONEditor from './JSONEditor';
import Inspector from './Inspector';
import Tokens from './Tokens';
import StartScreen from './StartScreen';
import Heading from './Heading';
import Navbar from './Navbar';
import Icon from './Icon';
import * as pjs from '../../../package.json';
import {useTokenState, SelectionValue} from '../store/TokenContext';
import {mergeTokens} from './utils';

const goToNodeId = (id) => {
    parent.postMessage(
        {
            pluginMessage: {
                type: 'gotonode',
                id,
            },
        },
        '*'
    );
};

const App = () => {
    const [disabled, setDisabled] = React.useState(false);
    const [active, setActive] = React.useState('start');
    const [remoteComponents, setRemoteComponents] = React.useState([]);

    const {state, setStringTokens, setPreviousTokens, setLoading, setSelectionValues, setNodeData} = useTokenState();

    const onSetNodeData = (data = {}) => {
        console.log('setting data in plugin', data);

        setLoading(true);
        setNodeData(data);
    };

    const removeTokenValues = () => {
        setLoading(true);
        setTimeout(() => {
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'remove-node-data',
                    },
                },
                '*'
            );
        }, 100);
    };

    const onInitiate = () => {
        parent.postMessage({pluginMessage: {type: 'initiate'}}, '*');
    };

    function setSingleTokenValue({parent, name, token}) {
        const obj = JSON5.parse(state.tokens[parent].values);
        objectPath.set(obj, name, token);
        setStringTokens({parent, tokens: JSON5.stringify(obj, null, 2)});
    }
    function setPluginValue(value) {
        setSelectionValues(() => {
            const newPluginValue = {
                ...state.selectionValue,
                ...value,
            };
            onSetNodeData(newPluginValue);
            return {...newPluginValue};
        });
    }

    React.useEffect(() => {
        onInitiate();
        window.onmessage = (event) => {
            const {type, values} = event.data.pluginMessage;
            if (type === 'selection') {
                setDisabled(false);
                if (values) {
                    setSelectionValues(values);
                } else {
                    setSelectionValues({});
                }
            } else if (type === 'noselection') {
                setDisabled(true);
                setSelectionValues({});
            } else if (type === 'remotecomponents') {
                setLoading(false);
                setRemoteComponents(values.remotes);
            } else if (type === 'tokenvalues') {
                setLoading(false);
                if (values) {
                    setPreviousTokens(values);
                    console.log('After set prev');
                    setActive('tokens');
                    console.log('After set active');
                }
            }
        };
    }, []);

    return (
        <>
            {state.loading && (
                <div className="fixed w-full z-20">
                    <div className="flex items-center space-x-2 bg-gray-300 p-2 rounded m-2">
                        <div className="inline-flex rotate">
                            <Icon name="loading" />
                        </div>
                        <div className="font-bold text-xxs">Hold on, updating...</div>
                    </div>
                </div>
            )}
            <div className="h-full flex flex-col">
                <div className="flex-grow flex flex-col space-y-4 p-4">
                    {active !== 'start' && <Navbar active={active} setActive={setActive} />}
                    {remoteComponents.length > 0 && (
                        <div>
                            <Heading size="small">Unable to update remote components</Heading>
                            {remoteComponents.map((comp) => (
                                <button
                                    type="button"
                                    className="p-2 text-xxs font-bold bg-gray-100"
                                    onClick={() => goToNodeId(comp.id)}
                                >
                                    {comp.id}
                                </button>
                            ))}
                        </div>
                    )}
                    {active === 'start' && !state.loading && <StartScreen setActive={setActive} />}
                    {active === 'tokens' && (
                        <Tokens
                            disabled={disabled}
                            setSingleTokenValue={setSingleTokenValue}
                            setPluginValue={setPluginValue}
                        />
                    )}
                    {active === 'json' && <JSONEditor />}
                    {active === 'inspector' && (
                        <Inspector
                            tokens={JSON5.parse(state.tokens.options.values)}
                            removeTokenValues={removeTokenValues}
                        />
                    )}
                </div>
                <div className="p-4 flex-shrink-0 flex items-center justify-between">
                    <div className="text-gray-600 text-xxs">Figma Tokens {pjs.version}</div>
                    <div className="text-gray-600 text-xxs">
                        <a
                            className="flex items-center"
                            href="https://github.com/six7/figma-tokens"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span className="mr-1">Feedback / Issues</span>
                            <Icon name="github" />
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;
