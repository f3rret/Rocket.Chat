import '../ee/client/ecdh';
import './polyfills';

import './lib/meteorCallWrapper';
import './importPackages';

import '../ee/client';
import './templateHelpers';
import './methods/deleteMessage';
import './methods/hideRoom';
import './methods/openRoom';
import './methods/setUserActiveStatus';
import './methods/toggleFavorite';
import './methods/toggleAutoDownload';
import './methods/updateMessage';
import './startup';
import './views/admin';
import './views/teams';
import './templates';

import('buffer').then(({Buffer}) => {global.Buffer = Buffer;}); //p2p
