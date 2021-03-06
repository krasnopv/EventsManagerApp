import React, { Component } from 'react';
import { Input, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import FormValidator from '../../helpers/form-validator';
import UserActions from '../../actions/UserActions';
import AuthChecker from '../../helpers/auth-checker';


/**
 * @returns {*} Component for SignUp
 */
export class Login extends Component {
/**
 *
 * @param {*} props
 */
  constructor(props) {
    super(props);
    this.state = {
      user: {
        email: '',
        password: ''
      },
      isLoading: false,
      isDisabled: false,
      serverError: '',
      errors: {}
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  /**
  * @returns {void}
  */
  componentWillMount() {
    if (AuthChecker.checkUserAuth()) {
      this.props.history.push('/centers');
    }
  }

  /**
   *
   * @param {*} nextProps
   *
   * @returns {void}
   */
  componentWillReceiveProps(nextProps) {
    const { data, status } = nextProps.response;
    if (status === 'failed') {
      this.setState({ serverError: data, isLoading: false, isDisabled: false });
    } else if (status === 'authenticated') {
      this.props.history.push('/');
    }
  }

  /**
   *
  *
  * @param {object} event
  *
  * @returns {void}
  *
  * this handles the event when any property in the state changes
  */
  onChange(event) {
    const { value, name } = event.target;
    const { user } = this.state;
    this.setState({
      user: {
        ...user,
        [name]: value
      }
    });
  }

  /**
   *
   * @param {object} event
   *
   * @returns {void}
   *
   * this handles the event when form is submitted
   */
  onSubmit(event) {
    event.preventDefault();
    this.setState({ isLoading: true, isDisabled: true, serverError: '' });
    const fv = new FormValidator();
    const { authUser } = this.props;
    const errors = fv.validateSignIn(this.state.user);
    if (errors) {
      this.setState({ errors, isLoading: false, isDisabled: false });
    } else {
      authUser(this.state.user);
    }
  }


  /**
   *@returns {void} view htmlFor langing page
   */
  render() {
    const { user, isLoading, errors, isDisabled, serverError } = this.state; // eslint-disable-line
    return (
      <div>
        {/* <Header /> */}
        <div className="home">
          <main className="section__hero" id="index-banner">
            <div className="my-container">
              <div className="form-container">
                <form name="singInForm" onSubmit={this.onSubmit}>
                  <h3>Login</h3>
                  <div className="App-signup animated bounceInRight" style={{ padding: '12px', paddingTop: '30px', paddingBottom: '20px' }} >
                    <div style={{ textAlign: 'center' }}><span style={{ color: 'red' }}>{ serverError && serverError }</span></div>
                    <span id="email" style={{ color: 'red', paddingBottom: '4px' }}>{errors.email && errors.email[0]}</span>
                    <Input fluid icon="at" placeholder="email" onChange={this.onChange} name="email" />
                    <br />
                    <span id="password" style={{ color: 'red' }}>{errors.password && errors.password[0]}</span>
                    <Input fluid icon="lock" type="password" placeholder="password" onChange={this.onChange} name="password" />
                    <span><Link style={{ textAlign: 'right' }} to="/forgot-password">Forgot Password</Link></span><br />
                    <br />
                    <Button color="facebook" fluid loading={isLoading} disabled={isDisabled}>login</Button>
                    <br />
                    <span id="for-new-user">New Here?<Link style={{ color: 'white !important' }} to="/register">Create an account</Link></span>
                  </div>
                </form>
              </div>
            </div>
            <div className="section" />
            <div className="section" />
          </main>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({ response: state.login });

const mapDispatchToProps = dispatch => bindActionCreators({
  authUser: UserActions.login
}, dispatch);

Login.propTypes = {
  response: PropTypes.objectOf(() => null),
  history: PropTypes.objectOf(() => null).isRequired,
  authUser: PropTypes.func
};

Login.defaultProps = {
  response: {},
  authUser: UserActions.login
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
