Feature: register User
  In order to register __ModuleLowerCase__
  As an __AuthRole__
  I want to be able to execute the custom register action

  Scenario: Successfully register a new user
    Given I send a POST request to "/v1/users/register" with body:
    """
    {
      "id": "713bd8a2-c119-4828-bfae-21ea2f57a942",
      "email": "newuser@example.com",
      "password": "mypassword"
    }
    """
    Then the response status code should be 201
    And the response should be empty
