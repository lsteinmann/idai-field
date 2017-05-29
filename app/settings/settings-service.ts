import {Injectable} from "@angular/core";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {Settings, SyncTarget} from "./settings";
import {SettingsSerializer} from "./settings-serializer";
import {FileSystemImagestore} from "../imagestore/file-system-imagestore";
import {Observable} from "rxjs/Rx";


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can be
 * serialized to and from config.json files.
 *
 * It is connected to the imagestore and datastore
 * subsystems which are controlled based on the settings.
 *
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class SettingsService {

    private observers = [];
    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();

    public ready: Promise<any>;

    constructor(private datastore: IdaiFieldDatastore,
                private fileSystemImagestore: FileSystemImagestore) {

        fileSystemImagestore.select('test');
    }

    public init() {
        this.ready = this.settingsSerializer.load().then((settings) => {
            this.settings = settings;
            if (this.settings.dbs && this.settings.dbs.length > 0) {
                this.datastore.select(this.settings.dbs[0]);
                this.activateProject(
                    this.settings.dbs[0],
                    this.settings.username,
                    this.settings.syncTarget);
            }
        })
    }

    public getSyncTarget() {
        return JSON.parse(JSON.stringify(this.settings.syncTarget));
    }

    public getUsername() {
        return this.settings.username ? JSON.parse(JSON.stringify(this.settings.username)) : 'anonymous';
    }

    public getProjects() {
        return this.settings.dbs;
    }

    public getSelectedProject() {
        if (!this.settings.dbs || this.settings.dbs.length == 0) {
            return undefined;
        } else {
            return this.settings.dbs[0];
        }
    }

    /**
     * Selects a project and triggers a (re-)start of
     * syncing of the corresponding db.
     *
     * @param projectName
     * @param username
     * @param syncTarget
     * @param restart
     * @returns {any}
     */
    public activateProject(
        projectName: string,
        username: string,
        syncTarget: SyncTarget,
        restart = false) {

        this.settings.username = username;
        this.settings.syncTarget = syncTarget;

        this.makeFirstIfExists(projectName);
        this.fileSystemImagestore.select(projectName);
        this.storeSettings();

        if (restart) {
            return this.restartSync();
        } else {
            return this.startSync();
        }
    }

    private startSync(): Promise<any> {

        let address = SettingsService.makeAddressFromSyncTarget(this.settings.syncTarget);
        if (!address) return Promise.resolve();

        return this.datastore.setupSync(address)
            .then(syncState => {
                const msg = setTimeout(() => this.observers.forEach(o => o.next('connected')), 500); // avoid issuing 'connected' too early
                syncState.onError.subscribe(() => {
                    clearTimeout(msg); // stop 'connected' msg if error
                    syncState.cancel();
                    this.observers.forEach(o => o.next('disconnected'));
                    setTimeout(() => this.startSync(), 5000); // retry
                });
                syncState.onChange.subscribe(() => this.observers.forEach(o => o.next('changed')));
                }
            );

    }

    private restartSync() {
        if (!this.settings.dbs || !(this.settings.dbs.length > 0)) return;

        this.datastore.select(this.settings.dbs[0]);
        return new Promise<any>((resolve) => {
            this.observers.forEach(o => o.next(false));
            this.datastore.stopSync();
            setTimeout(() => {
                this.startSync().then(() => resolve());
            }, 1000);
        })
    }

    private makeFirstIfExists(projectName: string) {

        const index = this.settings.dbs.indexOf(projectName);
        if (index != -1) {
            this.settings.dbs.splice(index, 1);
            this.settings.dbs.unshift(projectName);
        }
    }

    /**
     * Observe synchronization status changes. The following states can be
     * subscribed to:
     * * 'connected': The connection to the server has been established
     * * 'disconnected': The connection to the server has been lost
     * * 'changed': A changed document has been transmitted
     * @returns Observable<string>
     */
    public syncStatusChanges(): Observable<string> {

        return Observable.create(observer => {
            this.observers.push(observer);
        });
    }

    private static makeAddressFromSyncTarget(serverSetting) {

        let address = serverSetting['address'];

        if (!address || !serverSetting['username'] || !serverSetting['password']) return address;

        return address.replace('http://', 'http://' +
            serverSetting['username'] + ':' + serverSetting['password'] + '@');
    }

    private storeSettings(): Promise<any> {
        return this.settingsSerializer.store(this.settings);
    }

    private serverSettingsComplete(): boolean {

        return (this.settings.syncTarget['username'] && this.settings.syncTarget['username'].length > 0 &&
        this.settings.syncTarget['password'] && this.settings.syncTarget['password'].length > 0 &&
        this.settings.syncTarget['address'] && this.settings.syncTarget['address'].length > 0);
    }
}