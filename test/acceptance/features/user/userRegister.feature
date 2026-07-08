Feature: register User
  In order to register __ModuleLowerCase__
  As an __AuthRole__
  I want to be able to execute the custom register action

  Scenario: A valid non existing __moduleLowerCase__
    Given I send a POST request to "/v1/users/register" with body:
    """
    {}
    """
    Then the response status code should be 200
    And the response should be empty
