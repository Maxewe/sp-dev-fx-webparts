import * as React from 'react';
import styles from './SaveEmailToSharePoint.module.scss';
import { ISaveEmailToSharePointProps } from './ISaveEmailToSharePointProps';
import { SearchResults } from "@pnp/sp/search";
import { Icon, Dropdown, IDropdownOption, IDropdownStyles, PrimaryButton, Label, IDropdownProps, Link } from 'office-ui-fabric-react';
import Services from './Services/Services';
import * as strings from 'SaveEmailToSharePointWebPartStrings';


const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 300 } };
interface SaveEmailToSharePointState {
  allSites: any;
  selectedSite: any;
  allLibraries: any;
  selectedLibrary: any;
  savedLink: string;
  rootURL: string;
}
export default class SaveEmailToSharePoint extends React.Component<ISaveEmailToSharePointProps, SaveEmailToSharePointState> {
  private services = new Services();
  constructor(props: ISaveEmailToSharePointProps, state: SaveEmailToSharePointState) {
    super(props);
    this.state = {
      allSites: null,
      selectedSite: null,
      allLibraries: null,
      selectedLibrary: null,
      savedLink: '',
      rootURL: ''
    }
  }
  public componentWillMount() {
    this.getAllSites();
    this.getRootURL();
  }

  public getRootURL = () => {
    this.services.getRootSiteURL().then((rootURL) => {
      this.setState({
        rootURL: rootURL
      });
    });
  }
  private saveToLibrary = (file) => {
    let filename = Office.context.mailbox.item.subject + ".eml";
    this.services.saveFileToSP(this.state.selectedSite.key, this.state.selectedLibrary.key, filename, file).then((result) => {
      console.log(result.data.ServerRelativeUrl);
      this.setState({
        savedLink: this.state.rootURL + result.data.ServerRelativeUrl + "?web=1"
      })
    });
  }
  public getAllSites = () => {
    this.services.getSiteNames().then((allSiteResults: SearchResults) => {
      console.log(allSiteResults.PrimarySearchResults);
      let allsite = [];
      allSiteResults.PrimarySearchResults.forEach(element => {
        let siteValue = { key: element.Path, text: element.Title };
        allsite.push(siteValue);
      });
      this.setState({
        allSites: allsite
      });
    });
  }
  public getCurrentEmailContent = () => {
    let id = Office.context.mailbox.item.itemId;
    this.services.getEmailContent(this.props.context, id).then((response: any) => {
      console.log(response);
      //save to library
      this.saveToLibrary(response);
    }).catch((e) => {
      console.error(e);
    });
  }
  public OnSelectSite = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption) => {
    this.services.getAllDocumentLibary(item.key.toString()).then((libraries) => {
      if (libraries.length) {
        let allLib = [];
        libraries.forEach(element => {
          let library = { key: element.ServerRelativeUrl, text: element.Title };
          allLib.push(library);
        });
        this.setState({
          selectedSite: item,
          allLibraries: allLib
        });
      } else {
        this.setState({
          selectedSite: item
        });
      }
    });

  }
  public OnSelectLibrary = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption) => {
    this.setState({
      selectedLibrary: item
    });
  }
  public render(): React.ReactElement<ISaveEmailToSharePointProps> {
    return (
      <div className="ms-Grid" >
        <div className={styles.row}>
          {this.state.allSites ? <Dropdown
            label={strings.SiteLabel}
            selectedKey={this.state.selectedSite ? this.state.selectedSite.key : undefined}
            onChange={this.OnSelectSite}
            placeholder={strings.SitePlaceHolder}
            options={this.state.allSites}
            styles={dropdownStyles}
            className={styles.column}
            onRenderPlaceholder={this.onRenderforSite}
          /> : null}
        </div>
        <div className={styles.row}>
          {this.state.allLibraries ? <Dropdown
            label={strings.LibraryLabel}
            selectedKey={this.state.selectedLibrary ? this.state.selectedLibrary.key : undefined}
            onChange={this.OnSelectLibrary}
            placeholder={strings.LibraryPlaceHolder}
            options={this.state.allLibraries}
            styles={dropdownStyles}
            className={styles.column + " ms-fadeIn200"}
            onRenderPlaceholder={this.onRenderforLib}
          /> : null}
        </div>
        <div className={styles.row}>
          <PrimaryButton
            text={strings.Save}
            disabled={this.state.selectedLibrary ? false : true}
            className={styles.column + " btnSave"}
            onClick={this.getCurrentEmailContent} />

          <PrimaryButton
            text={strings.Cancel}
            className={styles.column + " btnCancel"}
            onClick={() => { Office.context.ui.closeContainer(); }} />
        </div>
        <div className={styles.row}>
          {this.state.savedLink.length ?
            <Link href={this.state.savedLink} target='_blank' className="ms-fadeIn500">
              Click to view the saved email
          </Link>
            : null}
        </div>
      </div>
    );
  }
  public onRenderforLib = (props: IDropdownProps): JSX.Element => {
    return (
      <React.Fragment>
        <Icon iconName="DocLibrary" className="ms-Grid-col ms-u-sm1" />
        <Label className="ms-Grid-col ms-u-sm4" style={{ marginTop: -4 }}>{props.label}</Label>
      </React.Fragment>
    );
  }
  public onRenderforSite = (props: IDropdownProps): JSX.Element => {
    return (
      <React.Fragment>
        <Icon iconName="Website" className="ms-Grid-col ms-u-sm1" />
        <Label className="ms-Grid-col ms-u-sm4" style={{ marginTop: -4 }}>{props.label}</Label>
      </React.Fragment>
    );
  }
}
